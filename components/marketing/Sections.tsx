import Link from "next/link";
import { Check, ChevronDown, Printer, MessageCircle } from "lucide-react";
import { FAQS, FEATURES, KIT, PLANS, whatsapp } from "@/lib/marketing/site";
import { Icon } from "./Icon";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* ---------- Hero visual: phone running Billo + a printed token ---------- */
export function PhoneMock() {
  const items = [
    ["Idli", 30, "/food-library/idli.jpg"],
    ["Dosa", 60, "/food-library/dosa.jpg"],
    ["Vada", 25, "/food-library/vada.jpg"],
    ["Poori", 50, "/food-library/poori.jpg"],
    ["Tea", 15, "/food-library/tea.jpg"],
    ["Coffee", 20, "/food-library/coffee.jpg"],
  ] as const;
  return (
    <div className="relative mx-auto w-full max-w-[420px]" aria-hidden>
      <div className="absolute -inset-6 rounded-[48px] bg-accent/20 blur-3xl" />
      {/* phone */}
      <div className="relative mx-auto w-[260px] rounded-[38px] border-[7px] border-[#0c1f20] bg-paper shadow-2xl sm:w-[290px]">
        <div className="mx-auto mt-1.5 h-4 w-20 rounded-full bg-[#0c1f20]" />
        <div className="px-3 pb-3 pt-2">
          <div className="mb-2 flex items-center gap-2">
            <img src="/brand/billo-icon.png" alt="" className="h-6 w-6" />
            <div className="h-8 flex-1 rounded-lg border border-border bg-white px-2 text-[10px] leading-8 text-muted">Search items…</div>
          </div>
          <div className="mb-2 flex gap-1.5 text-[10px] font-semibold">
            <span className="rounded-md bg-brand px-2 py-1 text-white">Breakfast</span>
            <span className="rounded-md border border-border bg-white px-2 py-1 text-ink-soft">Lunch</span>
            <span className="rounded-md border border-border bg-white px-2 py-1 text-ink-soft">Drinks</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {items.map(([n, p, img], i) => (
              <div key={n} className={`overflow-hidden rounded-xl border bg-white ${i === 0 ? "border-brand ring-2 ring-brand" : "border-border"}`}>
                <img src={img} alt="" className="aspect-[16/10] w-full object-cover" />
                <div className="px-2 py-1">
                  <p className="text-[10px] font-bold text-ink">{n}</p>
                  <p className="text-[11px] font-extrabold text-brand">₹{p}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-stretch overflow-hidden rounded-xl bg-brand-dark text-white">
            <div className="flex-1 px-3 py-2">
              <p className="text-sm font-extrabold text-accent">₹145</p>
              <p className="text-[9px] text-white/70">4 items · View cart</p>
            </div>
            <div className="flex items-center gap-1 bg-accent px-3 text-[11px] font-bold text-brand-deep">
              <Printer className="h-3.5 w-3.5" /> Print
            </div>
          </div>
        </div>
      </div>
      {/* printed token */}
      <div className="absolute right-1 bottom-10 w-[118px] rotate-6 drop-shadow-xl sm:-right-8 sm:w-[132px]">
        <div className="receipt-edge bg-white px-3 pb-5 pt-3 text-center font-mono text-[9px] leading-tight text-[#111]">
          <p className="font-bold">SRI KRISHNA TIFFINS</p>
          <p className="my-1 border-y border-dashed border-[#999] py-1">
            TOKEN<br />
            <span className="text-3xl font-black">42</span>
          </p>
          <p className="text-left">2 x Idli&nbsp;&nbsp;&nbsp;&nbsp;60.00<br />1 x Dosa&nbsp;&nbsp;&nbsp;&nbsp;60.00<br />1 x Vada&nbsp;&nbsp;&nbsp;&nbsp;25.00</p>
          <p className="mt-1 border-t border-dashed border-[#999] pt-1 font-bold">TOTAL Rs 145</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Feature grid ---------- */
export function FeatureGrid({ limit }: { limit?: number }) {
  const list = limit ? FEATURES.slice(0, limit) : FEATURES;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((f) => (
        <div key={f.title} className="card p-5 transition-shadow hover:shadow-md">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft">
            <Icon name={f.icon} className="h-5 w-5 text-brand" />
          </div>
          <h3 className="text-lg font-bold text-ink">{f.title}</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{f.text}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------- Pricing ---------- */
export function Pricing() {
  return (
    <div className="space-y-6">
      {/* Kit */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-dark p-6 text-white shadow-xl sm:p-8">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="inline-flex rounded-lg bg-accent px-2.5 py-1 text-xs font-extrabold text-brand-deep">COMPLETE SETUP</span>
            <h3 className="mt-3 text-2xl font-extrabold sm:text-3xl">{KIT.name}</h3>
            <p className="mt-1 text-white/75">Printer + installation + 1 year of Billo — ready to bill the same day.</p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {KIT.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[15px]">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 text-center ring-1 ring-white/15 lg:min-w-[240px]">
            <p className="text-sm text-white/70">One-time</p>
            <p className="text-5xl font-extrabold text-accent tabular">{inr(KIT.price)}</p>
            <p className="mt-1 text-sm text-white/70">App free for 12 months</p>
            <a href={whatsapp("Hi Billo, I want the Counter Kit (printer + setup) for ₹4,799.")} target="_blank" rel="noopener" className="btn btn-accent mt-4 w-full">
              Book setup
            </a>
          </div>
        </div>
      </div>

      {/* App plans */}
      <div>
        <p className="mb-3 text-center text-sm font-semibold text-muted">Already have a printer? Choose an app-only plan</p>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => {
            const hi = "highlight" in p && p.highlight;
            return (
              <div key={p.id} className={`card relative flex flex-col p-6 ${hi ? "ring-2 ring-brand" : ""}`}>
                {"badge" in p && p.badge && (
                  <span className={`absolute -top-3 left-6 rounded-lg px-2.5 py-1 text-xs font-bold ${hi ? "bg-brand text-white" : "bg-accent text-brand-deep"}`}>{p.badge}</span>
                )}
                <p className="font-bold text-ink">{p.name}</p>
                <p className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-ink tabular">{inr(p.price)}</span>
                  <span className="text-sm text-muted">/ {p.period}</span>
                </p>
                <p className="text-sm font-medium text-brand">{p.perMonth}</p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[15px] text-ink-soft">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={whatsapp(`Hi Billo, I want the ${p.name} plan (${inr(p.price)} for ${p.period}).`)}
                  target="_blank"
                  rel="noopener"
                  className={`btn mt-6 w-full ${hi ? "btn-primary" : "btn-ghost"}`}
                >
                  {p.cta}
                </a>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs text-muted">₹299 offer is for first-time customers only. Prices in INR.</p>
      </div>
    </div>
  );
}

/* ---------- FAQ (native details = no JS, crawlable) ---------- */
export function Faq({ items = FAQS }: { items?: readonly { q: string; a: string }[] }) {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
      {items.map((f) => (
        <details key={f.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-[16px] font-bold text-ink hover:bg-paper [&::-webkit-details-marker]:hidden">
            {f.q}
            <ChevronDown className="h-5 w-5 shrink-0 text-brand transition-transform group-open:rotate-180" />
          </summary>
          <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/* ---------- CTA band ---------- */
export function CtaBand({ title = "Start billing faster from tomorrow morning", text = "Get Billo set up at your counter — printer, menu and staff training included." }: { title?: string; text?: string }) {
  return (
    <section className="container-x py-16">
      <div className="relative overflow-hidden rounded-3xl bg-brand-dark px-6 py-12 text-center text-white sm:px-12">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-2xl" />
        <div className="relative">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/75">{text}</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <a href={whatsapp()} target="_blank" rel="noopener" className="btn btn-accent">
              <MessageCircle className="h-5 w-5" /> Get a free demo on WhatsApp
            </a>
            <Link href="/pricing" className="btn btn-ghost-dark">See pricing</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, text, center = true }: { eyebrow?: string; title: string; text?: string; center?: boolean }) {
  return (
    <div className={`mb-10 ${center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-lg text-muted">{text}</p>}
    </div>
  );
}

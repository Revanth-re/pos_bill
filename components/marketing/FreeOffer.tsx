"use client";

import { useState } from "react";
import { Check, MessageCircle, Phone, Printer, Store, Wrench, Sparkles, PlayCircle, ReceiptText } from "lucide-react";
import { SITE, whatsapp } from "@/lib/marketing/site";
import { FreeBill } from "./FreeBill";

/**
 * "Billo is free" offer — replaces all pricing on the website.
 * Interactive: pick your shop type, tap the 3 steps, and book a free setup + demo on WhatsApp.
 */
const SHOPS = [
  { id: "tiffin", label: "Tiffin centre", line: "Idli, dosa, vada with big token numbers — billed in 3 seconds." },
  { id: "restaurant", label: "Restaurant / hotel", line: "Dine-in & takeaway bills, kitchen slips and GST — from your phone." },
  { id: "fastfood", label: "Fast food", line: "One-tap items and tokens that keep the evening rush moving." },
  { id: "tea", label: "Tea / juice stall", line: "Tap, print, done — plus udhaari for your regulars." },
  { id: "bakery", label: "Bakery / sweets", line: "Quick bills, GST invoices and daily sales on your phone." },
  { id: "other", label: "Other shop", line: "Fast bills, printed receipts and daily reports — no computer needed." },
] as const;

const STEPS = [
  {
    icon: PlayCircle,
    title: "Free demo",
    short: "10 minutes, at your shop or on video call",
    points: ["We show Billo with YOUR menu items", "Print a real bill in front of you", "Ask anything — no obligation"],
  },
  {
    icon: Wrench,
    title: "Free setup",
    short: "We set up the machine + app at your counter",
    points: ["Connect & test your Bluetooth printer", "Load your full menu with photos & prices", "Train your cashier in 10 minutes"],
  },
  {
    icon: ReceiptText,
    title: "Bill free",
    short: "Use the full Billo platform free",
    points: ["Unlimited bills & token printing", "Udhaari khata, tiffin plans, staff & reports", "Updates and WhatsApp support included"],
  },
] as const;

const FREE_LIST = [
  "Unlimited bills & tokens",
  "Bluetooth bill printing",
  "Udhaari (credit) khata",
  "Tiffin / meal plans",
  "Staff logins & cash closing",
  "Daily sales on your phone",
  "Bills in your language",
  "Works when internet is slow",
];

export function FreeOffer() {
  const [shop, setShop] = useState<(typeof SHOPS)[number]["id"]>("tiffin");
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [hasPrinter, setHasPrinter] = useState<"yes" | "no" | null>(null);

  const s = SHOPS.find((x) => x.id === shop)!;
  const phoneOk = /^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").slice(-10));
  const message = [
    "Hi Billo! I want the FREE setup + demo.",
    `Shop type: ${s.label}`,
    name && `Name: ${name}`,
    phone && `Phone: ${phone}`,
    area && `Area: ${area}`,
    hasPrinter === "yes" ? "I already have a printer." : hasPrinter === "no" ? "I need help choosing a printer." : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-6">
      {/* Big free banner */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-dark p-6 text-white shadow-xl sm:p-10">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          {/* Left: the offer */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-brand-deep">
              <Sparkles className="h-3.5 w-3.5" /> 100% free · all features · ₹0 setup
            </span>
            <h3 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">
              Use Billo <span className="text-accent">free.</span>
              <br />
              We set it up <span className="text-accent">free.</span>
            </h3>
            <p className="mt-4 max-w-lg text-lg text-white/80">
              The complete Billo app with every feature — free. No plans, no setup cost, no card, no contract. We come to your counter, set up the billing machine and app, show you a live demo — and you start billing.
            </p>

            {/* Shop type picker */}
            <p className="mt-7 text-sm font-semibold text-white/70">What do you run?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SHOPS.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setShop(x.id)}
                  aria-pressed={shop === x.id}
                  className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-150 ${
                    shop === x.id ? "bg-accent text-brand-deep shadow-md" : "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15"
                  }`}
                >
                  {x.label}
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-start gap-2 text-[15px] text-white/90" aria-live="polite">
              <Store className="mt-0.5 h-5 w-5 shrink-0 text-accent" /> {s.line}
            </p>

            <ul className="mt-6 grid gap-x-4 gap-y-2 sm:grid-cols-2">
              {FREE_LIST.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[15px]">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" /> {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: booking card */}
          <div className="rounded-2xl bg-white p-5 text-ink shadow-2xl sm:p-6">
            <p className="text-lg font-extrabold">Book your free setup</p>
            <p className="text-sm text-muted">We&apos;ll call you to fix a time that suits you.</p>
            <div className="mt-4 space-y-3">
              <input className="w-full rounded-xl border border-border px-3.5 py-3 text-base outline-none focus:border-brand" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              <input
                className="w-full rounded-xl border border-border px-3.5 py-3 text-base outline-none focus:border-brand"
                placeholder="Mobile number"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, ""))}
              />
              <input className="w-full rounded-xl border border-border px-3.5 py-3 text-base outline-none focus:border-brand" placeholder="Area / city" value={area} onChange={(e) => setArea(e.target.value)} />
              <div>
                <p className="mb-1.5 text-sm font-semibold text-ink-soft">Do you have a bill printer?</p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["yes", "Yes, I have one"],
                      ["no", "No, help me"],
                    ] as const
                  ).map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setHasPrinter(v)}
                      aria-pressed={hasPrinter === v}
                      className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition-colors ${
                        hasPrinter === v ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft hover:bg-paper"
                      }`}
                    >
                      <Printer className="h-4 w-4" /> {l}
                    </button>
                  ))}
                </div>
                {hasPrinter === "no" && <p className="mt-1.5 text-xs text-muted">No problem — we&apos;ll suggest a printer that works and set it up for you.</p>}
              </div>
            </div>
            <a href={whatsapp(message)} target="_blank" rel="noopener" className="btn btn-primary mt-5 w-full text-base">
              <MessageCircle className="h-5 w-5" /> Book free setup on WhatsApp
            </a>
            <a href={`tel:+${SITE.phoneRaw}`} className="btn btn-ghost mt-2 w-full">
              <Phone className="h-4 w-4" /> Or call {SITE.phone}
            </a>
            {phone && !phoneOk && <p className="mt-2 text-xs text-danger">Check the mobile number (10 digits).</p>}
            <a href={SITE.registerUrl} className="mt-2 block text-center text-sm font-bold text-brand hover:underline">
              Or start yourself now — create free account →
            </a>
            <p className="mt-3 text-center text-xs text-muted">No card · No hidden charges · No contract</p>
          </div>
        </div>
      </div>

      {/* The whole app free — receipt that prints ₹0 */}
      <div className="rounded-3xl border border-border bg-paper p-6 sm:p-10">
        <FreeBill />
      </div>

      {/* 3 steps — tap to see what happens */}
      <div className="grid gap-3 md:grid-cols-3">
        {STEPS.map((st, i) => {
          const active = step === i;
          const Ico = st.icon;
          return (
            <button
              key={st.title}
              type="button"
              onClick={() => setStep(i)}
              aria-expanded={active}
              className={`card text-left transition-all duration-200 ${active ? "-translate-y-1 shadow-lg ring-2 ring-brand" : "hover:shadow-md"}`}
            >
              <div className="flex items-center gap-3 p-5 pb-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${active ? "bg-brand text-white" : "bg-brand-soft text-brand"}`}>
                  <Ico className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Step {i + 1} · Free</p>
                  <p className="text-lg font-extrabold text-ink">{st.title}</p>
                </div>
              </div>
              <p className="px-5 text-[15px] text-ink-soft">{st.short}</p>
              <ul className={`grid gap-2 px-5 transition-all duration-200 ${active ? "max-h-60 py-4 opacity-100" : "max-h-0 overflow-hidden py-2 opacity-0 md:max-h-60 md:py-4 md:opacity-100"}`}>
                {st.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {p}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}

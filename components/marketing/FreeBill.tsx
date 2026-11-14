"use client";

import { useEffect, useRef, useState } from "react";
import { Printer, RotateCcw, MessageCircle } from "lucide-react";
import { whatsapp } from "@/lib/marketing/site";

/**
 * "Your Billo bill" — a thermal-receipt that prints itself when it scrolls into view and
 * shows that everything costs ₹0. Tap "Print again" to replay. The full text is in the HTML
 * (only the height animates), so Google still reads it.
 */
const LINES: [string, string][] = [
  ["Billo app (Android, tablet, laptop)", "FREE"],
  ["ALL features — nothing locked", "FREE"],
  ["Unlimited bills & tokens", "FREE"],
  ["Udhaari, tiffin plans, GST bills", "FREE"],
  ["Staff logins, shifts, day closing", "FREE"],
  ["Owner reports on your phone", "FREE"],
  ["Setup at your counter", "FREE"],
  ["Printer connection & testing", "FREE"],
  ["Menu loading with photos", "FREE"],
  ["Staff training", "FREE"],
  ["Live demo with your menu", "FREE"],
  ["Updates & WhatsApp support", "FREE"],
];

export function FreeBill() {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(0); // bump to replay the print animation
  const [shown, setShown] = useState(true); // server HTML = fully printed

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const hide = setTimeout(() => setShown(false), 0);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRun((r) => r + 1);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => {
      clearTimeout(hide);
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    if (run === 0) return;
    const a = setTimeout(() => setShown(false), 0);
    const b = setTimeout(() => setShown(true), 350);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [run]);

  return (
    <div ref={ref} className="grid items-center gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <p className="eyebrow">Your cost with Billo</p>
        <h3 className="mt-2 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
          The whole app is free. <span className="text-brand">Every feature.</span> No setup cost.
        </h3>
        <p className="mt-4 max-w-xl text-lg text-ink-soft">
          No &ldquo;basic vs premium&rdquo;. No bill limit. No charge to come to your shop. You get the complete Billo platform and our team sets it up for you — and you pay <strong className="text-ink">₹0</strong>.
        </p>
        <div className="mt-6 grid max-w-md grid-cols-3 gap-2 text-center">
          {[
            ["₹0", "App"],
            ["₹0", "Setup"],
            ["₹0", "Per bill"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-2xl bg-brand-soft px-2 py-3">
              <p className="text-2xl font-extrabold text-brand-dark">{v}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{l}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a href={whatsapp("Hi Billo! I want the FREE app + FREE setup for my shop.")} target="_blank" rel="noopener" className="btn btn-primary">
            <MessageCircle className="h-5 w-5" /> Claim my free setup
          </a>
          <button type="button" onClick={() => setRun((r) => r + 1)} className="btn btn-ghost">
            <RotateCcw className="h-4 w-4" /> Print the bill again
          </button>
        </div>
      </div>

      {/* Printer + receipt */}
      <div className="mx-auto w-full max-w-[340px]" aria-label="Your Billo bill: everything free, total ₹0">
        <div className="relative z-10 flex items-center justify-between rounded-2xl bg-[#0c1f20] px-4 py-3 text-white shadow-xl">
          <span className="flex items-center gap-2 text-sm font-bold"><Printer className="h-4 w-4 text-accent" /> Billo printer</span>
          <span className={`h-2.5 w-2.5 rounded-full ${shown ? "bg-success" : "animate-pulse bg-accent"}`} />
        </div>
        <div className="mx-3 -mt-1 h-2 rounded-b bg-black/70" />
        <div
          className="mx-5 overflow-hidden transition-[max-height] ease-out"
          style={{ maxHeight: shown ? 900 : 0, transitionDuration: shown ? "1600ms" : "0ms" }}
        >
          <div className="receipt-edge bg-white px-4 pb-7 pt-4 font-mono text-[12px] leading-snug text-[#111] shadow-lg">
            <p className="text-center text-sm font-bold">BILLO · YOUR SHOP</p>
            <p className="text-center text-[11px] text-[#555]">Everything you need to bill</p>
            <div className="my-2 border-t border-dashed border-[#999]" />
            <ul className="space-y-1">
              {LINES.map(([item, price]) => (
                <li key={item} className="flex justify-between gap-3">
                  <span>{item}</span>
                  <span className="shrink-0 font-bold text-[#16803C]">{price}</span>
                </li>
              ))}
            </ul>
            <div className="my-2 border-t border-dashed border-[#999]" />
            <div className="flex items-end justify-between">
              <span className="text-sm font-bold">TOTAL</span>
              <span className="text-3xl font-black">₹0</span>
            </div>
            <p className="mt-1 text-right text-[11px] text-[#555]">No card · No contract · No hidden charges</p>
            <div className="my-2 border-t border-dashed border-[#999]" />
            <p className="text-center font-bold">THANK YOU — HAPPY BILLING!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

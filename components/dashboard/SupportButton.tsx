"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Headset, Phone, Mail, MessageCircle, X } from "lucide-react";
import { SITE, whatsapp } from "@/lib/marketing/site";

/** "Need help?" — call, WhatsApp or email Billo support. Next to the profile icon. */
export function SupportButton({ variant = "icon" }: { variant?: "icon" | "row" | "dot" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {variant === "dot" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-accent hover:bg-white/20"
          aria-label="Help & support"
          title="Help & support"
        >
          <Headset className="h-[18px] w-[18px]" />
        </button>
      ) : variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-sm font-bold text-brand-dark"
          aria-label="Contact Billo support"
        >
          <Headset className="h-4 w-4" /> Help
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/15 lg:justify-start"
          title="Help & support"
          aria-label="Help & support"
        >
          <Headset className="h-5 w-5 shrink-0 text-accent" /> <span className="hidden lg:inline">Help & support</span>
        </button>
      )}

      {open &&
        createPortal(
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="support-title" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-ink shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 id="support-title" className="text-xl font-extrabold">Need help?</h2>
                <p className="mt-1 text-sm text-ink-soft">Contact Billo support — we reply fast, in Telugu, Hindi or English.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-muted hover:bg-paper" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <a href={`tel:+${SITE.phoneRaw}`} className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-4 hover:bg-paper">
                <Phone className="h-5 w-5 text-brand" />
                <span className="flex-1">
                  <span className="block text-xs text-muted">Call</span>
                  <span className="block font-bold">{SITE.phone}</span>
                </span>
              </a>
              <a href={whatsapp("Hi Billo, I need help with my account.")} target="_blank" rel="noopener" className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-4 hover:bg-paper">
                <MessageCircle className="h-5 w-5 text-success" />
                <span className="flex-1">
                  <span className="block text-xs text-muted">WhatsApp</span>
                  <span className="block font-bold">{SITE.phone}</span>
                </span>
              </a>
              <a href={`mailto:${SITE.email}?subject=${encodeURIComponent("Billo support")}`} className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-4 hover:bg-paper">
                <Mail className="h-5 w-5 text-brand" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted">Email</span>
                  <span className="block truncate font-bold">{SITE.email}</span>
                </span>
              </a>
            </div>
          </div>
        </div>,
          document.body
        )}
    </>
  );
}

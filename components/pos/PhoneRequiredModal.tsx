"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { normalizeIndianMobile, MOBILE_ERROR } from "@/lib/phone";

/**
 * Owners who never gave a mobile number: this popup covers the app and can't be closed
 * (no ✕, outside taps and Esc do nothing) until a valid number is saved. After that it never shows again.
 */
export function PhoneRequiredModal() {
  const [show, setShow] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // If the owner's login already has a number (e.g. a new outlet), copy it over quietly instead of asking.
  useEffect(() => {
    let alive = true;
    fetch("/api/account/phone", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d?.hasPhone) {
          // Number already saved: refresh once so the app picks it up (never loop).
          let reloaded = false;
          try {
            reloaded = sessionStorage.getItem("billo-phone-sync") === "1";
            sessionStorage.setItem("billo-phone-sync", "1");
          } catch {
            /* ignore */
          }
          if (!reloaded) window.location.reload();
        } else setShow(true);
      })
      .catch(() => alive && setShow(true));
    return () => {
      alive = false;
    };
  }, []);

  // Block Esc / browser back while the popup is open.
  useEffect(() => {
    if (!show) return;
    const stopEsc = (e: KeyboardEvent) => e.key === "Escape" && e.preventDefault();
    const stayHere = () => history.pushState(null, "", location.href);
    history.pushState(null, "", location.href);
    window.addEventListener("keydown", stopEsc, true);
    window.addEventListener("popstate", stayHere);
    return () => {
      window.removeEventListener("keydown", stopEsc, true);
      window.removeEventListener("popstate", stayHere);
    };
  }, [show]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!normalizeIndianMobile(phone)) return setError(MOBILE_ERROR);
    setBusy(true);
    setError("");
    const res = await fetch("/api/account/phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, confirm: true }),
    }).catch(() => null);
    const body = res ? await res.json().catch(() => ({})) : {};
    if (!res?.ok) {
      setError(body.error || "Could not save. Check your internet and try again.");
      setBusy(false);
      return;
    }
    setShow(false);
    window.location.reload();
  }

  if (!show) return null;
  const valid = !!normalizeIndianMobile(phone);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="phone-required-title">
      <form onSubmit={save} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <Phone className="h-6 w-6" />
        </span>
        <h2 id="phone-required-title" className="mt-4 text-xl font-extrabold text-ink">
          Please enter your valid mobile number
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          Enter the number you use on <b className="text-ink">WhatsApp</b>. We&apos;ll call you on it for <b className="text-ink">free setup</b> and support.
        </p>
        <div className="mt-4 flex">
          <span className="flex items-center rounded-l-xl border border-r-0 border-border bg-paper px-3 text-lg font-bold text-ink-soft">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            autoFocus
            maxLength={14}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/[^\d+ -]/g, ""));
              setError("");
            }}
            placeholder="98765 43210"
            aria-label="Mobile number"
            className="w-full rounded-r-xl border border-border px-3 py-3 text-xl font-bold tracking-wide outline-none focus:border-brand"
          />
        </div>
        {(error || (phone && !valid)) && <p className="mt-2 text-sm font-semibold text-danger">{error || MOBILE_ERROR}</p>}
        <p className="mt-2 text-xs text-muted">🔒 Used only for your account. Never shared or sold.</p>
        <button
          type="submit"
          disabled={!valid || busy}
          className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-brand text-lg font-bold text-white disabled:opacity-40"
        >
          {busy ? "Saving…" : "Save number"}
        </button>
      </form>
    </div>
  );
}

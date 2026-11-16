"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { clearDeviceData } from "@/lib/auth/deviceData";

/**
 * Danger zone: owner deletes their account and every shop they own.
 * Three checks before anything is deleted: tick "I understand", type DELETE, enter password.
 */
export function DeleteAccountCard({ shops }: { shops: string[] }) {
  const [open, setOpen] = useState(false);
  const [agree, setAgree] = useState(false);
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ready = agree && typed.trim() === "DELETE" && password.length > 0 && !busy;

  function close() {
    if (busy) return;
    setOpen(false);
    setAgree(false);
    setTyped("");
    setPassword("");
    setError("");
  }

  async function confirmDelete() {
    if (!ready) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirm: "DELETE" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not delete the account.");
      await clearDeviceData({ dropOfflineBills: true });
      try {
        localStorage.clear();
      } catch {
        /* ignore */
      }
      await signOut({ redirect: false });
      window.location.replace("/login?deleted=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the account.");
      setBusy(false);
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-danger/30 bg-surface p-4 shadow-sm">
        <h2 className="text-lg font-bold text-danger">Delete account</h2>
        <p className="mt-1 text-sm text-muted">
          Permanently delete your Billo account, your shop{shops.length > 1 ? "s" : ""} and all data. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-danger px-4 text-base font-bold text-danger hover:bg-danger/5"
        >
          <Trash2 className="h-5 w-5" /> Delete my account
        </button>
      </section>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center" role="dialog" aria-modal="true" onClick={close}>
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-danger">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-xl font-extrabold">Delete account?</h3>
              </div>
              <button type="button" onClick={close} className="rounded-lg p-1 text-muted" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-[15px] text-ink">This will <b>permanently delete</b>:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-ink-soft">
              <li>
                Your shop{shops.length > 1 ? "s" : ""}: <b className="text-ink">{shops.join(", ")}</b>
              </li>
              <li>All bills, payments, orders and sales reports</li>
              <li>All products, menu, categories and prices</li>
              <li>All customers, udhaari and tiffin plans</li>
              <li>All staff logins you created, expenses and day closings</li>
              <li>Your own login and bill settings</li>
            </ul>
            <p className="mt-3 rounded-xl bg-danger/10 p-3 text-sm font-semibold text-danger">
              This cannot be undone. Billo cannot get this data back later.
            </p>

            <label className="mt-4 flex items-start gap-2.5 text-[15px] text-ink">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--color-danger)]" />
              I understand everything will be deleted forever.
            </label>

            <label className="mt-4 block text-sm font-semibold text-ink-soft">
              Type <b className="text-ink">DELETE</b> to confirm
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value.toUpperCase())}
                autoCapitalize="characters"
                autoComplete="off"
                className="mt-1 w-full rounded-xl border border-border px-3.5 py-3 text-base outline-none focus:border-danger"
                placeholder="DELETE"
              />
            </label>

            <label className="mt-3 block text-sm font-semibold text-ink-soft">
              Your password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1 w-full rounded-xl border border-border px-3.5 py-3 text-base outline-none focus:border-danger"
              />
            </label>

            {error && <p className="mt-3 text-sm font-semibold text-danger">{error}</p>}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={close} disabled={busy} className="min-h-12 rounded-xl border border-border text-base font-bold text-ink">
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={!ready}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-danger text-base font-bold text-white disabled:opacity-40"
              >
                <Trash2 className="h-5 w-5" /> {busy ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

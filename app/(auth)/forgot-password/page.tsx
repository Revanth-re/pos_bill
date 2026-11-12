"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Forgot password: email → 6-digit code by email → new password. */
export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post(url: string, body: unknown) {
    setBusy(true);
    setError(null);
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    setBusy(false);
    if (!res) {
      setError("No internet. Please try again.");
      return false;
    }
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Something went wrong. Please try again.");
      return false;
    }
    return true;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="mb-4 text-center">
          <img src="/brand/billo-logo.png" alt="Billo" className="mx-auto mb-4 h-14 w-auto" />
          <h1 className="text-xl font-extrabold text-ink">Reset password</h1>
          <p className="mt-1 text-sm text-muted">
            {step === "email" && "We'll email you a 6-digit code."}
            {step === "code" && `Enter the code sent to ${email}.`}
            {step === "done" && "Your password is changed."}
          </p>
        </div>

        <div className="card space-y-4 p-5">
          {step === "email" && (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await post("/api/auth/forgot-password", { email })) setStep("code");
              }}
            >
              <div>
                <label className="field-label" htmlFor="fp-email">Email</label>
                <input id="fp-email" type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@shop.com" />
              </div>
              {error && <p className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{error}</p>}
              <Button type="submit" className="w-full" size="lg" loading={busy}>Send code</Button>
            </form>
          )}

          {step === "code" && (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await post("/api/auth/reset-password", { email, otp, password })) setStep("done");
              }}
            >
              <div>
                <label className="field-label" htmlFor="fp-otp">6-digit code</label>
                <input
                  id="fp-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  className="field text-center text-2xl font-bold tracking-[0.4em]"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="fp-pass">New password</label>
                <input id="fp-pass" type="password" minLength={6} required className="field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
              </div>
              {error && <p className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{error}</p>}
              <Button type="submit" className="w-full" size="lg" loading={busy} disabled={otp.length !== 6 || password.length < 6}>
                Change password
              </Button>
              <button type="button" className="w-full text-center text-sm font-semibold text-brand" onClick={() => { setStep("email"); setOtp(""); setError(null); }}>
                Didn&apos;t get it? Send a new code
              </button>
            </form>
          )}

          {step === "done" && (
            <a href="/login" className="flex min-h-12 w-full items-center justify-center rounded-xl bg-brand font-bold text-white">
              Sign in with new password
            </a>
          )}
        </div>
        <p className="text-center text-sm">
          <a href="/login" className="font-semibold text-brand">Back to sign in</a>
        </p>
      </div>
    </div>
  );
}

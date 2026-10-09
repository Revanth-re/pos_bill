"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setServerError(null);
    let ok = false;
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      ok = !!result?.ok && !result?.error;
      if (result?.error && result.error !== "CredentialsSignin") {
        setSubmitting(false);
        setServerError("Server problem — couldn't reach the database. Please try again in a minute.");
        return;
      }
    } catch {
      // Sign-in can still succeed even if the client couldn't parse the response — check the session.
      const s = await fetch("/api/auth/session", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
      ok = !!s?.user;
    }
    setSubmitting(false);

    if (!ok) {
      setServerError("Invalid email or password.");
      return;
    }
    // Only same-site paths — never jump to another domain.
    const cb = searchParams.get("callbackUrl") || "";
    const dest = cb.startsWith("/") && !cb.startsWith("//") ? cb : "/dashboard";
    window.location.replace(dest);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border border-border bg-surface rounded-2xl shadow-sm p-5">
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-soft">Email</label>
        <input
          type="email"
          {...register("email")}
          className="w-full touch-target border border-border px-3 py-3 text-base outline-none focus:border-brand"
          placeholder="owner@shop.com"
        />
        {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-soft">Password</label>
        <input
          type="password"
          {...register("password")}
          className="w-full touch-target border border-border px-3 py-3 text-base outline-none focus:border-brand"
          placeholder="••••••••"
        />
        {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
      </div>

      {serverError && (
        <p className="border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger rounded-xl">{serverError}</p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-xs text-muted">
        New business?{" "}
        <a href="/register" className="font-semibold text-brand">
          Create an account
        </a>
      </p>
    </form>
  );
}

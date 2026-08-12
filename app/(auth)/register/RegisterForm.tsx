"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  ownerName: z.string().min(1, "Your name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
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

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Unable to create your account. Please try again.");
      setSubmitting(false);
      return;
    }

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    setSubmitting(false);

    if (result?.error) {
      setServerError("Account created — please sign in.");
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border-2 border-border bg-surface p-5">
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-soft">Business name</label>
        <input
          {...register("businessName")}
          className="w-full touch-target border-2 border-border px-3 py-3 text-base outline-none focus:border-brand"
          placeholder="Sri Balaji Tiffin Center"
        />
        {errors.businessName && <p className="mt-1 text-xs text-danger">{errors.businessName.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-soft">Your name</label>
        <input
          {...register("ownerName")}
          className="w-full touch-target border-2 border-border px-3 py-3 text-base outline-none focus:border-brand"
          placeholder="Ramesh Kumar"
        />
        {errors.ownerName && <p className="mt-1 text-xs text-danger">{errors.ownerName.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-soft">Email</label>
        <input
          type="email"
          {...register("email")}
          className="w-full touch-target border-2 border-border px-3 py-3 text-base outline-none focus:border-brand"
          placeholder="owner@shop.com"
        />
        {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-soft">Phone (optional)</label>
        <input
          {...register("phone")}
          className="w-full touch-target border-2 border-border px-3 py-3 text-base outline-none focus:border-brand"
          placeholder="98765 43210"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-soft">Password</label>
        <input
          type="password"
          {...register("password")}
          className="w-full touch-target border-2 border-border px-3 py-3 text-base outline-none focus:border-brand"
          placeholder="At least 6 characters"
        />
        {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
      </div>

      {serverError && (
        <p className="border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{serverError}</p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
        {submitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-xs text-muted">
        Already have an account?{" "}
        <a href="/login" className="font-semibold text-brand">
          Sign in
        </a>
      </p>
    </form>
  );
}

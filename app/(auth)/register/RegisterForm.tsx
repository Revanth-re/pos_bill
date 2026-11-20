"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { normalizeIndianMobile, MOBILE_ERROR } from "@/lib/phone";

const schema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  ownerName: z.string().min(1, "Your name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(1, "Mobile number is required").refine((v) => !!normalizeIndianMobile(v), MOBILE_ERROR),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // First "Create account": we clear only the mobile number and ask again ("enter your valid number").
  // People who typed a quick fake number usually type their real one the second time.
  const [askedAgain, setAskedAgain] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    if (!askedAgain) {
      setAskedAgain(true);
      setValue("phone", "");
      setError("phone", { type: "manual", message: "Please enter your valid mobile number" });
      setFocus("phone");
      return;
    }
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border border-border bg-surface rounded-2xl shadow-sm p-5">
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-soft">Business name</label>
        <input
          {...register("businessName")}
          className="w-full touch-target border border-border px-3 py-3 text-base outline-none focus:border-brand"
          placeholder="Sri Balaji Tiffin Center"
        />
        {errors.businessName && <p className="mt-1 text-xs text-danger">{errors.businessName.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-soft">Your name</label>
        <input
          {...register("ownerName")}
          className="w-full touch-target border border-border px-3 py-3 text-base outline-none focus:border-brand"
          placeholder="Ramesh Kumar"
        />
        {errors.ownerName && <p className="mt-1 text-xs text-danger">{errors.ownerName.message}</p>}
      </div>
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
        <label className="mb-1 block text-xs font-semibold text-ink-soft">Mobile number (WhatsApp)</label>
        <div className="flex">
          <span className="flex items-center border border-r-0 border-border bg-paper px-3 text-base font-semibold text-ink-soft">+91</span>
          <input
            {...register("phone")}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={14}
            className={`w-full touch-target border px-3 py-3 text-base outline-none focus:border-brand ${errors.phone ? "border-danger" : "border-border"}`}
            placeholder="98765 43210"
          />
        </div>
        {errors.phone && <p className="mt-1 text-sm font-semibold text-danger">{errors.phone.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-soft">Password</label>
        <input
          type="password"
          {...register("password")}
          className="w-full touch-target border border-border px-3 py-3 text-base outline-none focus:border-brand"
          placeholder="At least 6 characters"
        />
        {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
      </div>

      {serverError && (
        <p className="border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger rounded-xl">{serverError}</p>
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

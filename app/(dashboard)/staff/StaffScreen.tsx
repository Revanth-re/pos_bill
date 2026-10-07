"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Role = "OWNER" | "MANAGER" | "CASHIER";
type Status = "ACTIVE" | "DISABLED";

interface StaffRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  billCount: number;
}

const ROLE_CAN: Record<string, string> = {
  OWNER: "Full access",
  MANAGER: "Discounts, refunds, cancellations, reports",
  CASHIER: "Create bills, take payments, reprint",
};

const ROLE_LABEL: Record<Role, string> = { OWNER: "Owner", MANAGER: "Manager", CASHIER: "Cashier" };

const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  role: z.enum(["OWNER", "MANAGER", "CASHIER"]),
});
type StaffFormValues = z.infer<typeof staffSchema>;

export function StaffScreen({
  initialStaff,
  currentStaffId,
}: {
  initialStaff: StaffRow[];
  currentStaffId: string;
}) {
  const [staff, setStaff] = useState(initialStaff);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateRole(id: string, role: Role) {
    setError(null);
    const res = await fetch(`/api/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Unable to update role.");
      return;
    }
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, role } : s)));
  }

  async function toggleStatus(row: StaffRow) {
    setError(null);
    const newStatus: Status = row.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const res = await fetch(`/api/staff/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Unable to update status.");
      return;
    }
    setStaff((prev) => prev.map((s) => (s.id === row.id ? { ...s, status: newStatus } : s)));
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Staff</h1>
          <p className="text-sm text-muted">{staff.length} people</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <span className="inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Add Staff
          </span>
        </Button>
      </div>

      {error && (
        <p className="border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger rounded-xl">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {staff.map((s) => (
          <div key={s.id} className={cn("card flex flex-col p-4 hover:shadow-md", s.status !== "ACTIVE" && "opacity-75")}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-base font-extrabold text-brand-dark">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">
                    {s.name} {s.id === currentStaffId && <span className="text-sm font-medium text-muted">(you)</span>}
                  </p>
                  <p className="truncate text-sm text-muted">{s.email}</p>
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold",
                  s.status === "ACTIVE" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                )}
              >
                {s.status === "ACTIVE" ? "Active" : "Disabled"}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-lg px-2 py-0.5 text-xs font-bold",
                  s.role === "OWNER" ? "bg-brand-dark text-accent" : s.role === "MANAGER" ? "bg-brand text-white" : "bg-brand-soft text-brand-dark"
                )}
              >
                {ROLE_LABEL[s.role]}
              </span>
              <span className="text-xs text-muted">{ROLE_CAN[s.role]}</span>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-paper px-3 py-2">
              <span className="text-xs font-medium text-muted">Bills created</span>
              <span className="text-base font-extrabold text-ink tabular">{s.billCount}</span>
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <select
                value={s.role}
                onChange={(e) => updateRole(s.id, e.target.value as Role)}
                disabled={s.id === currentStaffId}
                aria-label="Role"
                className="field min-h-11 flex-1 py-2 text-sm"
              >
                {(["OWNER", "MANAGER", "CASHIER"] as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
              {s.id !== currentStaffId && (
                <button
                  onClick={() => toggleStatus(s)}
                  className={cn(
                    "min-h-11 rounded-xl border px-3 text-sm font-semibold transition-colors duration-150",
                    s.status === "ACTIVE" ? "border-danger/30 text-danger hover:bg-danger-soft" : "border-success/30 text-success hover:bg-success-soft"
                  )}
                >
                  {s.status === "ACTIVE" ? "Disable" : "Re-enable"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Link href="/performance" className="card flex items-center justify-between gap-3 p-4 transition-shadow hover:shadow-md">
        <div>
          <p className="font-bold text-ink">Staff performance</p>
          <p className="text-sm text-muted">Sales, discounts, cancellations and cash accuracy per person</p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-brand">Open →</span>
      </Link>

      {formOpen && (
        <AddStaffSheet
          onClose={() => setFormOpen(false)}
          onCreated={(row) => {
            setStaff((prev) => [...prev, row]);
            setFormOpen(false);
          }}
        />
      )}
    </div>
  );
}

function AddStaffSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (row: StaffRow) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffFormValues>({ resolver: zodResolver(staffSchema), defaultValues: { role: "CASHIER" } });

  async function onSubmit(values: StaffFormValues) {
    setSubmitting(true);
    setServerError(null);
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Unable to add the staff member.");
      return;
    }
    const body = await res.json();
    onCreated({
      id: body.staff.id,
      name: body.staff.user.name,
      email: body.staff.user.email,
      role: body.staff.role,
      status: "ACTIVE",
      billCount: 0,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="toast-enter max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-border bg-surface shadow-lg pb-[env(safe-area-inset-bottom)] sm:w-[calc(100%-24px)] sm:max-w-[520px] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold text-ink">Add Staff</h2>
          <button onClick={onClose} className="touch-target rounded-full p-2 hover:bg-paper">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <div>
            <label className="field-label">Name</label>
            <input {...register("name")} className="field" placeholder="Priya Sharma" />
            {errors.name && <p className="mt-1 text-sm text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <label className="field-label">Email (used to sign in)</label>
            <input type="email" {...register("email")} className="field" placeholder="priya@example.com" />
            {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
          </div>
          <div>
            <label className="field-label">Temporary password</label>
            <input type="password" {...register("password")} className="field" />
            {errors.password && <p className="mt-1 text-sm text-danger">{errors.password.message}</p>}
          </div>
          <div>
            <label className="field-label">Role</label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-2">
                  {(["OWNER", "MANAGER", "CASHIER"] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => field.onChange(r)}
                      className={cn(
                        "touch-target rounded-xl border text-sm font-bold",
                        field.value === r ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft"
                      )}
                    >
                      {ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
          {serverError && (
            <p className="border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger rounded-xl">{serverError}</p>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Adding…" : "Add Staff Member"}
          </Button>
        </form>
      </div>
    </div>
  );
}

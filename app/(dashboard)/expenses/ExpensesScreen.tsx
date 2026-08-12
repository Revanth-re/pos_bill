"use client";

import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatINR, cn } from "@/lib/utils";
import { toast } from "@/stores/toastStore";

interface ExpenseRow {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  paymentMethod: "CASH" | "UPI" | "CARD" | "CREDIT";
  categoryId: string;
  categoryName: string;
}

type RangeFilter = "today" | "week" | "month" | "all";

function isWithin(dateIso: string, range: RangeFilter): boolean {
  if (range === "all") return true;
  const date = new Date(dateIso);
  const now = new Date();
  if (range === "today") {
    return date.toDateString() === now.toDateString();
  }
  const days = range === "week" ? 7 : 30;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}

const expenseSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than 0"),
  categoryId: z.string().min(1, "Choose a category"),
  description: z.string().optional(),
  paymentMethod: z.enum(["CASH", "UPI", "CARD", "CREDIT"]),
});
type ExpenseFormInput = z.input<typeof expenseSchema>;
type ExpenseFormValues = z.output<typeof expenseSchema>;

export function ExpensesScreen({
  initialExpenses,
  categories,
  canManage,
}: {
  initialExpenses: ExpenseRow[];
  categories: { id: string; name: string }[];
  canManage: boolean;
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [range, setRange] = useState<RangeFilter>("today");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(
    () =>
      expenses.filter(
        (e) => isWithin(e.date, range) && (!categoryFilter || e.categoryId === categoryFilter)
      ),
    [expenses, range, categoryFilter]
  );
  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Expenses</h1>
          <p className="text-base text-muted">{filtered.length} entries</p>
        </div>
        {canManage && (
          <Button onClick={() => setFormOpen(true)}>
            <span className="inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Add Expense
            </span>
          </Button>
        )}
      </div>

      <div className="border-2 border-border bg-ink p-4 text-white">
        <p className="text-sm font-semibold opacity-80">
          Total {range === "today" ? "today" : range === "week" ? "this week" : range === "month" ? "this month" : "(all time)"}
        </p>
        <p className="text-3xl font-extrabold tabular">{formatINR(total)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["today", "week", "month", "all"] as RangeFilter[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "touch-target rounded-md border-2 px-4 text-sm font-bold",
              range === r ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft"
            )}
          >
            {r === "today" ? "Today" : r === "week" ? "This Week" : r === "month" ? "This Month" : "All"}
          </button>
        ))}
        <select
          value={categoryFilter ?? ""}
          onChange={(e) => setCategoryFilter(e.target.value || null)}
          className="touch-target border-2 border-border bg-surface px-3 text-sm font-semibold"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <p className="text-base text-muted mb-3">No expenses in this range</p>
          {canManage && <Button onClick={() => setFormOpen(true)}>Add Expense</Button>}
        </div>
      ) : (
        <ul className="rounded-2xl border border-border bg-surface divide-y divide-border shadow-sm overflow-hidden">
          {filtered.map((e) => (
            <li key={e.id} className="flex items-center justify-between p-3">
              <div>
                <p className="font-bold text-ink">{e.categoryName}</p>
                <p className="text-sm text-muted">
                  {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {e.paymentMethod}
                  {e.description ? ` · ${e.description}` : ""}
                </p>
              </div>
              <p className="text-lg font-bold text-danger tabular">-{formatINR(e.amount)}</p>
            </li>
          ))}
        </ul>
      )}

      {formOpen && (
        <AddExpenseSheet
          categories={categories}
          onClose={() => setFormOpen(false)}
          onCreated={(row) => {
            setExpenses((prev) => [row, ...prev]);
            setFormOpen(false);
          }}
        />
      )}
    </div>
  );
}

function AddExpenseSheet({
  categories,
  onClose,
  onCreated,
}: {
  categories: { id: string; name: string }[];
  onClose: () => void;
  onCreated: (row: ExpenseRow) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { paymentMethod: "CASH" },
  });

  async function onSubmit(values: ExpenseFormValues) {
    setSubmitting(true);
    setServerError(null);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Unable to save the expense.");
      return;
    }
    const body = await res.json();
    toast.success("Expense saved");
    onCreated({
      id: body.expense.id,
      amount: Number(body.expense.amount),
      date: body.expense.date,
      description: body.expense.description,
      paymentMethod: body.expense.paymentMethod,
      categoryId: body.expense.categoryId,
      categoryName: body.expense.category.name,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-border bg-surface shadow-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold text-ink">Add Expense</h2>
          <button onClick={onClose} className="touch-target rounded-full p-2 hover:bg-paper">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="field-label">Amount (₹)</label>
            <input type="number" step="0.01" {...register("amount")} className="field" placeholder="0" />
            {errors.amount && <p className="mt-1 text-sm text-danger">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="field-label">Category</label>
            <select {...register("categoryId")} className="field">
              <option value="">Choose a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-sm text-danger">{errors.categoryId.message}</p>}
          </div>

          <div>
            <label className="field-label">Paid by</label>
            <Controller
              name="paymentMethod"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-4 gap-2">
                  {(["CASH", "UPI", "CARD", "CREDIT"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => field.onChange(m)}
                      className={cn(
                        "touch-target rounded-md border-2 px-1 text-sm font-bold",
                        field.value === m ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft"
                      )}
                    >
                      {m === "CASH" ? "Cash" : m === "UPI" ? "UPI" : m === "CARD" ? "Card" : "Credit"}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          <div>
            <label className="field-label">Description (optional)</label>
            <input {...register("description")} className="field" placeholder="e.g. Gas cylinder refill" />
          </div>

          {serverError && (
            <p className="border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{serverError}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Saving…" : "Save Expense"}
          </Button>
        </form>
      </div>
    </div>
  );
}

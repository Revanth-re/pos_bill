"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, X, Check, SkipForward, PlusCircle, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatINR, cn } from "@/lib/utils";
import { CustomerPickerSheet } from "@/components/pos/CustomerPickerSheet";

interface Plan {
  id: string;
  name: string;
  price: number;
  totalMeals: number;
  durationDays: number;
}

interface Subscription {
  id: string;
  customer: { name: string; phone: string | null };
  plan: { name: string };
  totalMeals: number;
  mealsUsed: number;
  mealsSkipped: number;
  extraMeals: number;
  endDate: string;
  amountPaid: number;
}

export function TiffinScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [planFormOpen, setPlanFormOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/tiffin/plans").then((r) => r.json()),
      fetch("/api/tiffin/subscriptions").then((r) => r.json()),
    ]).then(([p, s]) => {
      setPlans(p.plans ?? []);
      setSubs(s.subscriptions ?? []);
      setLoading(false);
    });
  }, []);

  const [now] = useState(() => Date.now());
  const expiring = useMemo(
    () => subs.filter((s) => new Date(s.endDate).getTime() - now < 3 * 24 * 60 * 60 * 1000),
    [subs, now]
  );
  const mealsUsedToday = 0; // per-day breakdown needs usage-log date filtering — logged but not yet surfaced here

  async function recordUsage(subId: string, type: "USED" | "SKIPPED" | "EXTRA") {
    const res = await fetch(`/api/tiffin/subscriptions/${subId}/usage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "Unable to record.");
      return;
    }
    const body = await res.json();
    setSubs((prev) =>
      prev.map((s) =>
        s.id === subId
          ? {
              ...s,
              mealsUsed: Number(body.subscription.mealsUsed),
              mealsSkipped: Number(body.subscription.mealsSkipped),
              extraMeals: Number(body.subscription.extraMeals),
            }
          : s
      )
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Tiffin / Meal Subscriptions</h1>
          <p className="text-base text-muted">{subs.length} active plans</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setPlanFormOpen(true)}>
            New Plan
          </Button>
          {plans.length > 0 && (
            <Button onClick={() => setAssignOpen(true)}>
              <span className="inline-flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> Assign
              </span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="border-2 border-border bg-surface p-3">
          <p className="text-sm font-semibold text-muted">Active Plans</p>
          <p className="text-xl font-extrabold tabular">{subs.length}</p>
        </div>
        <div className="border-2 border-border bg-surface p-3">
          <p className="text-sm font-semibold text-muted">Meals Today</p>
          <p className="text-xl font-extrabold tabular">{mealsUsedToday}</p>
        </div>
        <div className="border-2 border-danger bg-danger-soft p-3">
          <p className="text-sm font-semibold text-danger">Expiring Soon</p>
          <p className="text-xl font-extrabold tabular text-danger">{expiring.length}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-base text-muted">Loading…</p>
      ) : subs.length === 0 ? (
        <div className="border-2 border-border bg-surface p-8 text-center">
          <p className="text-base text-muted mb-3">No active tiffin subscriptions</p>
          {plans.length === 0 ? (
            <Button onClick={() => setPlanFormOpen(true)}>Create a Plan</Button>
          ) : (
            <Button onClick={() => setAssignOpen(true)}>Assign a Plan</Button>
          )}
        </div>
      ) : (
        <ul className="border-2 border-border bg-surface divide-y-2 divide-border">
          {subs.map((s) => {
            const remaining = s.totalMeals - s.mealsUsed;
            const expiringSoon = new Date(s.endDate).getTime() - now < 3 * 24 * 60 * 60 * 1000;
            return (
              <li key={s.id} className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-border bg-paper text-ink-soft">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-ink truncate">{s.customer.name}</p>
                      <p className="text-sm text-muted truncate">{s.plan.name}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-extrabold tabular text-ink">
                      {s.mealsUsed} / {s.totalMeals}
                    </p>
                    <p className={cn("text-sm", expiringSoon ? "text-danger font-bold" : "text-muted")}>
                      {expiringSoon ? "Expires soon" : `Ends ${new Date(s.endDate).toLocaleDateString("en-IN")}`}
                    </p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => recordUsage(s.id, "USED")}
                    disabled={remaining <= 0}
                    className="touch-target rounded-md border-2 border-success text-success flex items-center justify-center gap-1 text-sm font-bold disabled:opacity-40"
                  >
                    <Check className="h-4 w-4" /> Meal Used
                  </button>
                  <button
                    onClick={() => recordUsage(s.id, "SKIPPED")}
                    className="touch-target rounded-md border-2 border-border text-ink-soft flex items-center justify-center gap-1 text-sm font-bold"
                  >
                    <SkipForward className="h-4 w-4" /> Skip
                  </button>
                  <button
                    onClick={() => recordUsage(s.id, "EXTRA")}
                    className="touch-target rounded-md border-2 border-gold text-gold flex items-center justify-center gap-1 text-sm font-bold"
                  >
                    <PlusCircle className="h-4 w-4" /> Extra
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {planFormOpen && (
        <NewPlanSheet
          onClose={() => setPlanFormOpen(false)}
          onCreated={(p) => {
            setPlans((prev) => [...prev, p]);
            setPlanFormOpen(false);
          }}
        />
      )}

      {assignOpen && (
        <AssignPlanFlow
          plans={plans}
          onClose={() => setAssignOpen(false)}
          onAssigned={(s) => {
            setSubs((prev) => [...prev, s]);
            setAssignOpen(false);
          }}
        />
      )}
    </div>
  );
}

function NewPlanSheet({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Plan) => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [totalMeals, setTotalMeals] = useState("30");
  const [durationDays, setDurationDays] = useState("30");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const p = parseFloat(price);
    const m = parseInt(totalMeals, 10);
    const d = parseInt(durationDays, 10);
    if (!name.trim() || !p || !m || !d) {
      setError("Fill in all fields.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/tiffin/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price: p, totalMeals: m, durationDays: d }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Unable to save the plan.");
      return;
    }
    const body = await res.json();
    onCreated({
      id: body.plan.id,
      name: body.plan.name,
      price: Number(body.plan.price),
      totalMeals: body.plan.totalMeals,
      durationDays: body.plan.durationDays,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
      <div className="w-full sm:max-w-sm border-t-2 sm:border-2 border-ink bg-surface">
        <div className="flex items-center justify-between border-b-2 border-border p-4">
          <h2 className="text-lg font-bold text-ink">New Meal Plan</h2>
          <button onClick={onClose} className="touch-target rounded-full p-2 hover:bg-paper">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="field-label">Plan name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="Monthly Lunch" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="field-label">Price (₹)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="field" />
            </div>
            <div>
              <label className="field-label">Meals</label>
              <input type="number" value={totalMeals} onChange={(e) => setTotalMeals(e.target.value)} className="field" />
            </div>
            <div>
              <label className="field-label">Days</label>
              <input type="number" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} className="field" />
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Create Plan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AssignPlanFlow({
  plans,
  onClose,
  onAssigned,
}: {
  plans: Plan[];
  onClose: () => void;
  onAssigned: (s: Subscription) => void;
}) {
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const plan = plans.find((p) => p.id === planId);

  async function handleSubmit() {
    if (!planId || !customerId) {
      setError("Choose a plan and a customer.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/tiffin/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, customerId, amountPaid: plan?.price ?? 0 }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Unable to assign the plan.");
      return;
    }
    const body = await res.json();
    onAssigned({
      id: body.subscription.id,
      customer: body.subscription.customer,
      plan: body.subscription.plan,
      totalMeals: body.subscription.totalMeals,
      mealsUsed: 0,
      mealsSkipped: 0,
      extraMeals: 0,
      endDate: body.subscription.endDate,
      amountPaid: Number(body.subscription.amountPaid),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
      <div className="w-full sm:max-w-sm border-t-2 sm:border-2 border-ink bg-surface">
        <div className="flex items-center justify-between border-b-2 border-border p-4">
          <h2 className="text-lg font-bold text-ink">Assign Plan</h2>
          <button onClick={onClose} className="touch-target rounded-full p-2 hover:bg-paper">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="field-label">Plan</label>
            <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="field">
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatINR(p.price)} / {p.totalMeals} meals
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Customer</label>
            <button
              onClick={() => setPickerOpen(true)}
              className="field text-left flex items-center justify-between"
            >
              <span>{customerName || "Select customer"}</span>
              <User className="h-4 w-4 text-muted" />
            </button>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Assign Plan"}
          </Button>
        </div>
      </div>

      <CustomerPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(id, name) => {
          setCustomerId(id);
          setCustomerName(name);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}

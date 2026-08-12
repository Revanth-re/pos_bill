"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatINR, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

interface Summary {
  totalSales: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  creditSales: number;
  expensesTotal: number;
  discountsTotal: number;
  openingCash: number;
  expectedCash: number;
}

interface Closing extends Summary {
  actualCash: number;
  cashDifference: number;
  closedAt: string;
}

export function DayClosingScreen() {
  const [loading, setLoading] = useState(true);
  const [closed, setClosed] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [closing, setClosing] = useState<Closing | null>(null);
  const [actualCash, setActualCash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/day-closing")
      .then((r) => r.json())
      .then((d) => {
        if (d.closed) {
          setClosed(true);
          setClosing(d.closing);
        } else {
          setSummary(d.summary);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleClose() {
    const amount = parseFloat(actualCash);
    if (isNaN(amount) || amount < 0) {
      setError("Enter the amount of cash counted in the drawer.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/day-closing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actualCash: amount }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Unable to close the day.");
      return;
    }
    const body = await res.json();
    setClosed(true);
    setClosing({
      totalSales: Number(body.closing.totalSales),
      cashSales: Number(body.closing.cashSales),
      upiSales: Number(body.closing.upiSales),
      cardSales: Number(body.closing.cardSales),
      creditSales: Number(body.closing.creditSales),
      expensesTotal: Number(body.closing.expensesTotal),
      discountsTotal: Number(body.closing.discountsTotal),
      openingCash: Number(body.closing.openingCash),
      expectedCash: Number(body.closing.expectedCash),
      actualCash: Number(body.closing.actualCash),
      cashDifference: Number(body.closing.cashDifference),
      closedAt: body.closing.closedAt,
    });
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4 max-w-lg">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const data = closed ? closing! : summary!;

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-lg">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Day Closing</h1>
        <p className="text-base text-muted">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      {closed && (
        <div className="flex items-center gap-2 border-2 border-success bg-success-soft p-3">
          <Lock className="h-5 w-5 text-success shrink-0" />
          <p className="text-sm font-bold text-ink">
            Day closed at {new Date(closing!.closedAt).toLocaleTimeString("en-IN")}. This summary is locked.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm space-y-2">
        <Row label="Total Sales" value={formatINR(data.totalSales)} bold />
        <Row label="Cash Sales" value={formatINR(data.cashSales)} />
        <Row label="UPI Sales" value={formatINR(data.upiSales)} />
        <Row label="Card Sales" value={formatINR(data.cardSales)} />
        <Row label="Credit Sales" value={formatINR(data.creditSales)} />
        <Row label="Discounts Given" value={formatINR(data.discountsTotal)} />
        <Row label="Expenses" value={formatINR(data.expensesTotal)} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm space-y-2">
        <Row label="Opening Cash" value={formatINR(data.openingCash)} />
        <Row label="Expected Cash" value={formatINR(data.expectedCash)} bold />
        {closed ? (
          <>
            <Row label="Actual Cash" value={formatINR(closing!.actualCash)} bold />
            <div
              className={cn(
                "flex items-center justify-between pt-2 border-t-2 border-border font-extrabold text-lg",
                closing!.cashDifference === 0 ? "text-success" : closing!.cashDifference > 0 ? "text-gold" : "text-danger"
              )}
            >
              <span>Difference</span>
              <span className="tabular">
                {closing!.cashDifference > 0 ? "+" : ""}
                {formatINR(closing!.cashDifference)}
              </span>
            </div>
          </>
        ) : (
          <div className="pt-2">
            <label className="field-label">Actual cash counted</label>
            <input
              type="number"
              step="0.01"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              className="field"
              placeholder="0"
            />
          </div>
        )}
      </div>

      {error && (
        <p className="border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{error}</p>
      )}

      {!closed && (
        <Button size="lg" className="w-full" onClick={handleClose} disabled={submitting}>
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            {submitting ? "Closing…" : "Close Today"}
          </span>
        </Button>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between", bold && "font-extrabold text-lg")}>
      <span className={cn("text-sm", !bold && "text-ink-soft")}>{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}

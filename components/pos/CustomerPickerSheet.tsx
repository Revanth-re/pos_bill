"use client";

import { useEffect, useState } from "react";
import { X, Search, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CustomerOption {
  id: string;
  name: string;
  phone: string | null;
}

export function CustomerPickerSheet({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string, name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timeout = setTimeout(() => {
      setLoading(true);
      fetch(`/api/customers?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setResults(d.customers ?? []);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [open, query]);

  if (!open) return null;

  async function handleQuickAdd() {
    if (!query.trim()) return;
    setCreating(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: query.trim() }),
    });
    setCreating(false);
    if (res.ok) {
      const body = await res.json();
      onSelect(body.customer.id, body.customer.name);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
      <div className="w-full sm:max-w-sm border-t-2 sm:border-2 border-ink bg-surface max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b-2 border-border p-4">
          <h2 className="text-lg font-bold text-ink">Select Customer</h2>
          <button onClick={onClose} className="touch-target rounded-full p-2 hover:bg-paper">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 pb-2">
          <div className="flex items-center gap-2 border-2 border-border bg-surface px-3 touch-target">
            <Search className="h-5 w-5 text-muted shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or phone…"
              className="flex-1 bg-transparent py-2.5 text-base outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-0">
          {loading && <p className="text-sm text-muted">Searching…</p>}
          {!loading && results.length === 0 && query.trim() && (
            <Button variant="secondary" className="w-full" onClick={handleQuickAdd} disabled={creating}>
              <span className="inline-flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                {creating ? "Adding…" : `Add "${query.trim()}" as a new customer`}
              </span>
            </Button>
          )}
          <ul className="divide-y-2 divide-border border-2 border-border mt-2">
            {results.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => onSelect(c.id, c.name)}
                  className="flex w-full items-center gap-3 p-3 text-left hover:bg-paper"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-border bg-paper text-ink-soft">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-ink">{c.name}</p>
                    {c.phone && <p className="text-sm text-muted">{c.phone}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

/** Tabs for the Billo team panel (/admin). */
export function AdminNav({ active }: { active: "overview" | "users" | "shop" }) {
  const tab = (href: string, label: string, on: boolean) => (
    <Link
      href={href}
      className={`rounded-xl px-4 py-2 text-sm font-bold ${on ? "bg-brand text-white" : "border border-border bg-surface text-ink-soft hover:bg-paper"}`}
    >
      {label}
    </Link>
  );
  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Admin">
      <span className="mr-1 rounded-lg bg-danger/10 px-2 py-1 text-xs font-extrabold uppercase tracking-wide text-danger">Billo team only</span>
      {tab("/admin", "Shops", active === "overview" || active === "shop")}
      {tab("/admin/users", "Users", active === "users")}
    </nav>
  );
}

export function AdminKpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-ink tabular">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

export const fmtIST = (d?: Date | null, withTime = true) =>
  d
    ? d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
      })
    : "—";

import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { isBilloAdmin } from "@/lib/admin";
import { istDayStart, istDaysAgoStart, istDateKey } from "@/lib/time";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

/**
 * Billo usage — for the Billo team only (ADMIN_EMAILS). Shows every shop on Billo and
 * how much it is actually used: bills today / 7 days / 30 days, last bill, active days.
 */
export default async function AdminUsagePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireSession();
  if (!isBilloAdmin(session.email)) notFound();

  const term = ((await searchParams).q ?? "").trim();
  const today = istDayStart();
  const d7 = istDaysAgoStart(6);
  const d30 = istDaysAgoStart(29);
  const live = { status: { notIn: ["CANCELLED", "REFUNDED"] as ("CANCELLED" | "REFUNDED")[] } };

  const [businesses, last, recent, installs] = await Promise.all([
    prisma.business.findMany({
      where: term
        ? {
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { city: { contains: term, mode: "insensitive" } },
              { phone: { contains: term } },
              { staff: { some: { user: { OR: [{ email: { contains: term, mode: "insensitive" } }, { name: { contains: term, mode: "insensitive" } }, { phone: { contains: term } }] } } } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        city: true,
        phone: true,
        createdAt: true,
        staff: { where: { role: "OWNER" }, take: 1, select: { user: { select: { name: true, email: true } } } },
        _count: { select: { staff: true, products: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.groupBy({ by: ["businessId"], where: live, _max: { createdAt: true }, _count: { _all: true }, _sum: { grandTotal: true } }),
    prisma.invoice.findMany({
      where: { createdAt: { gte: d30 }, ...live },
      select: { businessId: true, createdAt: true, grandTotal: true },
      take: 100_000,
    }),
    prisma.auditLog.findMany({ where: { action: "APP_INSTALLED" }, select: { businessId: true, metadata: true, createdAt: true } }),
  ]);
  // Installed apps per shop: devices, and how many came from the Play Store vs Chrome's "Install app".
  const inst = new Map<string, { devices: number; play: number; chrome: number }>();
  for (const r of installs) {
    const x = inst.get(r.businessId) ?? { devices: 0, play: 0, chrome: 0 };
    x.devices += 1;
    if ((r.metadata as { source?: string } | null)?.source === "playstore") x.play += 1;
    else x.chrome += 1;
    inst.set(r.businessId, x);
  }
  const installedShops = inst.size;
  const installedDevices = installs.length;
  const playDevices = [...inst.values()].reduce((a, x) => a + x.play, 0);

  type Stat = { today: number; todaySales: number; w: number; m: number; mSales: number; days7: Set<string> };
  const stats = new Map<string, Stat>();
  for (const inv of recent) {
    const s = stats.get(inv.businessId) ?? { today: 0, todaySales: 0, w: 0, m: 0, mSales: 0, days7: new Set<string>() };
    const amt = Number(inv.grandTotal);
    s.m += 1;
    s.mSales += amt;
    if (inv.createdAt >= d7) {
      s.w += 1;
      s.days7.add(istDateKey(inv.createdAt));
    }
    if (inv.createdAt >= today) {
      s.today += 1;
      s.todaySales += amt;
    }
    stats.set(inv.businessId, s);
  }
  const lastBill = new Map(last.map((l) => [l.businessId, { at: l._max.createdAt, total: l._count._all, sales: Number(l._sum.grandTotal ?? 0) }]));

  const rows = businesses
    .map((b) => {
      const s = stats.get(b.id);
      const lb = lastBill.get(b.id);
      const status = !lb?.at ? "New" : s?.today ? "Active today" : s?.w ? "This week" : "Inactive";
      return { b, s, lb, status };
    })
    .sort((x, y) => (y.lb?.at?.getTime() ?? 0) - (x.lb?.at?.getTime() ?? 0));

  const activeToday = rows.filter((r) => r.status === "Active today").length;
  const activeWeek = rows.filter((r) => r.s?.w).length;
  const billsToday = rows.reduce((a, r) => a + (r.s?.today ?? 0), 0);
  const salesToday = rows.reduce((a, r) => a + (r.s?.todaySales ?? 0), 0);
  const newThisWeek = businesses.filter((b) => b.createdAt >= d7).length;

  const fmtWhen = (d?: Date | null) =>
    d ? d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" }) : "—";
  const tone: Record<string, string> = {
    "Active today": "bg-success-soft text-success",
    "This week": "bg-accent-soft text-brand-dark",
    Inactive: "bg-danger-soft text-danger",
    New: "bg-paper text-muted",
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 lg:p-6">
      <AdminNav active="overview" />
      <div>
        <h1 className="text-2xl font-extrabold text-ink sm:text-[28px]">Billo usage</h1>
        <p className="text-base text-muted">Every shop on Billo and how much it&apos;s really used. Visible only to the Billo team.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Shops" value={String(businesses.length)} />
        <Kpi label="Active today" value={String(activeToday)} />
        <Kpi label="Active this week" value={String(activeWeek)} />
        <Kpi label="New this week" value={String(newThisWeek)} />
        <Kpi label="Bills today" value={String(billsToday)} />
        <Kpi label="Sales today" value={formatINR(salesToday)} />
        <Kpi label="Income — all shops, all time" value={formatINR(last.reduce((a, l) => a + Number(l._sum.grandTotal ?? 0), 0))} />
        <Kpi label="Bills — all time" value={String(last.reduce((a, l) => a + l._count._all, 0))} />
        <Kpi label="Shops with app installed" value={String(installedShops)} />
        <Kpi label="Installed devices" value={`${installedDevices} (${playDevices} Play Store)`} />
      </section>

      <div className="card overflow-x-auto">
        <form className="flex gap-2 p-3" action="/admin">
          <input name="q" defaultValue={term} placeholder="Search shop, city, owner email or mobile" aria-label="Search shops" className="min-h-11 flex-1 rounded-xl border border-border bg-surface px-3 text-base outline-none focus:border-brand" />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-3">Shop</th>
              <th className="p-3">Owner</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Today</th>
              <th className="p-3 text-right">7 days</th>
              <th className="p-3 text-right">Days used (7)</th>
              <th className="p-3 text-right">30 days</th>
              <th className="p-3 text-right">All time</th>
              <th className="p-3">App</th>
              <th className="p-3">Last bill</th>
              <th className="p-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ b, s, lb, status }) => {
              const owner = b.staff[0]?.user;
              return (
                <tr key={b.id} className="border-t border-border align-top">
                  <td className="p-3">
                    <Link href={`/admin/shops/${b.id}`} className="font-bold text-brand hover:underline">{b.name} →</Link>
                    <p className="text-xs text-muted">{[b.city, b.phone].filter(Boolean).join(" · ") || "—"}</p>
                    <p className="text-xs text-muted">
                      {b._count.products} items · {b._count.staff} staff
                    </p>
                  </td>
                  <td className="p-3">
                    <p className="text-ink">{owner?.name ?? "—"}</p>
                    <p className="text-xs text-muted">{owner?.email ?? ""}</p>
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${tone[status]}`}>{status}</span>
                  </td>
                  <td className="p-3 text-right tabular">
                    <p className="font-semibold text-ink">{s?.today ?? 0} bills</p>
                    <p className="text-xs text-muted">{formatINR(s?.todaySales ?? 0)}</p>
                  </td>
                  <td className="p-3 text-right tabular">{s?.w ?? 0}</td>
                  <td className="p-3 text-right tabular">{s?.days7.size ?? 0} / 7</td>
                  <td className="p-3 text-right tabular">
                    <p>{s?.m ?? 0}</p>
                    <p className="text-xs text-muted">{formatINR(s?.mSales ?? 0)}</p>
                  </td>
                  <td className="p-3 text-right tabular">
                    <p>{lb?.total ?? 0}</p>
                    <p className="text-xs font-semibold text-ink">{formatINR(lb?.sales ?? 0)}</p>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {inst.get(b.id) ? (
                      <>
                        <p className="font-semibold text-success">📱 {inst.get(b.id)!.devices} device{inst.get(b.id)!.devices > 1 ? "s" : ""}</p>
                        <p className="text-xs text-muted">
                          {[inst.get(b.id)!.play ? `${inst.get(b.id)!.play} Play Store` : "", inst.get(b.id)!.chrome ? `${inst.get(b.id)!.chrome} Chrome` : ""].filter(Boolean).join(" · ")}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-muted">Browser only</span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">{fmtWhen(lb?.at)}</td>
                  <td className="p-3 whitespace-nowrap">{fmtWhen(b.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">Counts skip cancelled and refunded bills. Days are India time.</p>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-extrabold tabular text-ink">{value}</p>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { isBilloAdmin } from "@/lib/admin";
import { istDayStart, istDaysAgoStart, istDateKey, nowMs } from "@/lib/time";
import { formatINR } from "@/lib/utils";
import { AdminNav, AdminKpi, fmtIST } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

/** One shop in full: owner, staff, products, income, payment split, top items and recent bills. Billo team only. */
export default async function AdminShopPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (!isBilloAdmin(session.email)) notFound();
  const { id } = await params;

  const live = { businessId: id, status: { notIn: ["CANCELLED", "REFUNDED"] as ("CANCELLED" | "REFUNDED")[] } };
  const today = istDayStart();
  const d7 = istDaysAgoStart(6);
  const d30 = istDaysAgoStart(29);

  const shop = await prisma.business.findUnique({
    where: { id },
    select: {
      id: true, name: true, city: true, state: true, address: true, phone: true, email: true, gstin: true, gstEnabled: true, language: true, createdAt: true,
      staff: { orderBy: { createdAt: "asc" }, select: { id: true, role: true, status: true, createdAt: true, lastSeenAt: true, user: { select: { id: true, name: true, email: true, phone: true } } } },
      _count: { select: { customers: true, products: true, invoices: true, expenses: true } },
    },
  });
  if (!shop) notFound();

  const ownerUserIds = shop.staff.filter((s) => s.role === "OWNER").map((s) => s.user.id);
  const [allTime, todayAgg, wAgg, mAgg, cancelled, credit, expenses30, pay30, top30, daily, bills, products, outlets] = await Promise.all([
    prisma.invoice.aggregate({ where: live, _sum: { grandTotal: true }, _count: { _all: true }, _min: { createdAt: true }, _max: { createdAt: true } }),
    prisma.invoice.aggregate({ where: { ...live, createdAt: { gte: today } }, _sum: { grandTotal: true }, _count: { _all: true } }),
    prisma.invoice.aggregate({ where: { ...live, createdAt: { gte: d7 } }, _sum: { grandTotal: true }, _count: { _all: true } }),
    prisma.invoice.aggregate({ where: { ...live, createdAt: { gte: d30 } }, _sum: { grandTotal: true }, _count: { _all: true } }),
    prisma.invoice.count({ where: { businessId: id, status: { in: ["CANCELLED", "REFUNDED"] } } }),
    prisma.customer.aggregate({ where: { businessId: id }, _sum: { outstandingBalance: true } }),
    prisma.expense.aggregate({ where: { businessId: id, date: { gte: d30 } }, _sum: { amount: true } }),
    prisma.payment.groupBy({ by: ["method"], where: { invoice: { ...live, createdAt: { gte: d30 } } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.invoiceItem.groupBy({
      by: ["productName"],
      where: { invoice: { ...live, createdAt: { gte: d30 } } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 10,
    }),
    prisma.invoice.findMany({ where: { ...live, createdAt: { gte: d30 } }, select: { createdAt: true, grandTotal: true }, take: 50_000 }),
    prisma.invoice.findMany({
      where: { businessId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, invoiceNumber: true, createdAt: true, grandTotal: true, status: true,
        order: { select: { type: true, label: true } },
        staff: { select: { user: { select: { name: true } } } },
        items: { select: { productName: true, quantity: true } },
        payments: { select: { method: true, amount: true } },
      },
    }),
    prisma.product.findMany({
      where: { businessId: id },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      select: { id: true, name: true, sellingPrice: true, gstPercent: true, status: true, category: { select: { name: true } } },
      take: 500,
    }),
    ownerUserIds.length
      ? prisma.business.findMany({ where: { id: { not: id }, staff: { some: { userId: { in: ownerUserIds }, role: "OWNER" } } }, select: { id: true, name: true, city: true } })
      : Promise.resolve([]),
  ]);

  // Daily sales for the last 30 days (IST days).
  const byDay = new Map<string, { n: number; s: number }>();
  for (let i = 29; i >= 0; i--) byDay.set(istDateKey(istDaysAgoStart(i)), { n: 0, s: 0 });
  for (const d of daily) {
    const k = istDateKey(d.createdAt);
    const x = byDay.get(k);
    if (x) {
      x.n += 1;
      x.s += Number(d.grandTotal);
    }
  }
  const days = [...byDay.entries()];
  const maxDay = Math.max(1, ...days.map(([, x]) => x.s));
  const activeDays = days.filter(([, x]) => x.n > 0).length;

  const allSales = Number(allTime._sum.grandTotal ?? 0);
  const allBills = allTime._count._all;
  const mSales = Number(mAgg._sum.grandTotal ?? 0);
  const payTotal = pay30.reduce((a, p) => a + Number(p._sum.amount ?? 0), 0);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 lg:p-6">
      <AdminNav active="shop" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            <ArrowLeft className="h-4 w-4" /> All shops
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-[28px]">{shop.name}</h1>
          <p className="text-sm text-muted">
            {[shop.address, shop.city, shop.state].filter(Boolean).join(", ") || "No address"} · Joined {fmtIST(shop.createdAt, false)}
          </p>
          <p className="text-sm text-muted">
            {[shop.phone && `📞 ${shop.phone}`, shop.email, shop.gstEnabled && shop.gstin ? `GSTIN ${shop.gstin}` : "", `Bill language: ${shop.language}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        {shop.phone && (
          <a href={`https://wa.me/${shop.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="btn btn-primary">
            WhatsApp owner
          </a>
        )}
      </div>

      {outlets.length > 0 && (
        <p className="text-sm text-ink-soft">
          Other outlets of this owner:{" "}
          {outlets.map((o, i) => (
            <span key={o.id}>
              {i > 0 && ", "}
              <Link href={`/admin/shops/${o.id}`} className="font-semibold text-brand hover:underline">{o.name}</Link>
            </span>
          ))}
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminKpi label="Total income (all time)" value={formatINR(allSales)} sub={`${allBills} bills`} />
        <AdminKpi label="Last 30 days" value={formatINR(mSales)} sub={`${mAgg._count._all} bills · ${activeDays}/30 days active`} />
        <AdminKpi label="Last 7 days" value={formatINR(Number(wAgg._sum.grandTotal ?? 0))} sub={`${wAgg._count._all} bills`} />
        <AdminKpi label="Today" value={formatINR(Number(todayAgg._sum.grandTotal ?? 0))} sub={`${todayAgg._count._all} bills`} />
        <AdminKpi label="Average bill" value={formatINR(allBills ? allSales / allBills : 0)} />
        <AdminKpi label="Credit pending (udhaari)" value={formatINR(Number(credit._sum.outstandingBalance ?? 0))} sub={`${shop._count.customers} customers`} />
        <AdminKpi label="Expenses (30 days)" value={formatINR(Number(expenses30._sum.amount ?? 0))} />
        <AdminKpi label="Cancelled / refunded" value={String(cancelled)} sub={`First bill ${fmtIST(allTime._min.createdAt, false)}`} />
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-bold text-ink">Daily sales — last 30 days</h2>
        <div className="mt-3 flex h-40 items-end gap-1" role="img" aria-label="Daily sales bar chart for the last 30 days">
          {days.map(([k, x]) => (
            <div key={k} className="flex h-full flex-1 flex-col justify-end" title={`${k}: ${formatINR(x.s)} · ${x.n} bills`}>
              <div className="w-full rounded-t bg-brand" style={{ height: `${Math.max(x.s ? 3 : 0, (x.s / maxDay) * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>{days[0]?.[0]}</span>
          <span>Today</span>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="text-lg font-bold text-ink">How customers paid (30 days)</h2>
          {pay30.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No payments yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {pay30
                .sort((a, b) => Number(b._sum.amount ?? 0) - Number(a._sum.amount ?? 0))
                .map((p) => {
                  const amt = Number(p._sum.amount ?? 0);
                  return (
                    <li key={p.method}>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-ink">{p.method}</span>
                        <span className="tabular text-ink-soft">
                          {formatINR(amt)} · {payTotal ? Math.round((amt / payTotal) * 100) : 0}%
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded bg-paper">
                        <div className="h-2 rounded bg-brand" style={{ width: `${payTotal ? (amt / payTotal) * 100 : 0}%` }} />
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </section>

        <section className="card p-4">
          <h2 className="text-lg font-bold text-ink">Top items (30 days)</h2>
          {top30.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No sales yet.</p>
          ) : (
            <table className="mt-2 w-full text-sm">
              <tbody>
                {top30.map((t) => (
                  <tr key={t.productName} className="border-t border-border">
                    <td className="py-2 font-semibold text-ink">{t.productName}</td>
                    <td className="py-2 text-right tabular text-muted">{Number(t._sum.quantity ?? 0)} sold</td>
                    <td className="py-2 text-right tabular font-semibold">{formatINR(Number(t._sum.lineTotal ?? 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="card overflow-x-auto">
        <h2 className="p-4 pb-2 text-lg font-bold text-ink">Staff & logins ({shop.staff.length})</h2>
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wide text-muted">
            <tr><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Email</th><th className="p-3">Mobile</th><th className="p-3">Status</th><th className="p-3">Last seen</th><th className="p-3">Added</th></tr>
          </thead>
          <tbody>
            {shop.staff.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="p-3 font-semibold text-ink">{s.user.name}</td>
                <td className="p-3">{s.role}</td>
                <td className="p-3">{s.user.email}</td>
                <td className="p-3">{s.user.phone ?? "—"}</td>
                <td className="p-3">{s.status}</td>
                <td className="p-3 whitespace-nowrap">
                  {s.lastSeenAt && nowMs() - s.lastSeenAt.getTime() < 2 * 60_000 ? <span className="font-bold text-success">● Online</span> : fmtIST(s.lastSeenAt)}
                </td>
                <td className="p-3 whitespace-nowrap">{fmtIST(s.createdAt, false)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card overflow-x-auto">
        <h2 className="p-4 pb-2 text-lg font-bold text-ink">Recent bills (last 50 of {shop._count.invoices})</h2>
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wide text-muted">
            <tr><th className="p-3">Bill</th><th className="p-3">When (IST)</th><th className="p-3">Type</th><th className="p-3">Items</th><th className="p-3">Paid by</th><th className="p-3">Cashier</th><th className="p-3 text-right">Total</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {bills.length === 0 && (
              <tr><td colSpan={8} className="p-4 text-center text-muted">No bills yet.</td></tr>
            )}
            {bills.map((b) => (
              <tr key={b.id} className="border-t border-border align-top">
                <td className="p-3 font-semibold text-ink whitespace-nowrap">{b.invoiceNumber}</td>
                <td className="p-3 whitespace-nowrap">{fmtIST(b.createdAt)}</td>
                <td className="p-3 whitespace-nowrap">{b.order?.type === "DINE_IN" ? "Dine-in" : "Takeaway"}{b.order?.label ? ` · ${b.order.label}` : ""}</td>
                <td className="p-3 text-ink-soft">{b.items.map((i) => `${Number(i.quantity)}× ${i.productName}`).join(", ")}</td>
                <td className="p-3 whitespace-nowrap">{b.payments.map((p) => `${p.method} ${formatINR(Number(p.amount))}`).join(" + ") || "—"}</td>
                <td className="p-3 whitespace-nowrap">{b.staff?.user?.name ?? "—"}</td>
                <td className="p-3 text-right font-bold tabular">{formatINR(Number(b.grandTotal))}</td>
                <td className="p-3"><span className={b.status === "CANCELLED" || b.status === "REFUNDED" ? "font-semibold text-danger" : "text-success"}>{b.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card overflow-x-auto">
        <h2 className="p-4 pb-2 text-lg font-bold text-ink">Products ({shop._count.products})</h2>
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wide text-muted">
            <tr><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">GST</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 font-semibold text-ink">{p.name}</td>
                <td className="p-3">{p.category?.name ?? "—"}</td>
                <td className="p-3 text-right tabular">{formatINR(Number(p.sellingPrice))}</td>
                <td className="p-3 text-right tabular">{Number(p.gstPercent)}%</td>
                <td className="p-3">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

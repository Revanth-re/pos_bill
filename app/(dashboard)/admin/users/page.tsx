import { nowMs } from "@/lib/time";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { isBilloAdmin } from "@/lib/admin";
import { AdminNav, AdminKpi, fmtIST } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

/** Every login on Billo (owners, managers, cashiers, kitchen) with their shop. Billo team only. */
export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const session = await requireSession();
  if (!isBilloAdmin(session.email)) notFound();
  const { q = "", role = "" } = await searchParams;
  const term = q.trim();
  const roles = ["OWNER", "MANAGER", "CASHIER", "KITCHEN"] as const;
  const roleFilter = roles.includes(role as (typeof roles)[number]) ? (role as (typeof roles)[number]) : undefined;

  const [users, counts] = await Promise.all([
    prisma.user.findMany({
      where: {
        ...(term
          ? { OR: [{ name: { contains: term, mode: "insensitive" } }, { email: { contains: term, mode: "insensitive" } }, { phone: { contains: term } }] }
          : {}),
        ...(roleFilter ? { staff: { some: { role: roleFilter } } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true, name: true, email: true, phone: true, createdAt: true,
        staff: { select: { role: true, status: true, lastSeenAt: true, business: { select: { id: true, name: true } } } },
      },
    }),
    prisma.staff.groupBy({ by: ["role"], _count: { _all: true } }),
  ]);
  const total = await prisma.user.count();
  const c = (r: string) => counts.find((x) => x.role === r)?._count._all ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 lg:p-6">
      <AdminNav active="users" />
      <h1 className="text-2xl font-extrabold text-ink sm:text-[28px]">Users</h1>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <AdminKpi label="All logins" value={String(total)} />
        <AdminKpi label="Owners" value={String(c("OWNER"))} />
        <AdminKpi label="Managers" value={String(c("MANAGER"))} />
        <AdminKpi label="Cashiers" value={String(c("CASHIER"))} />
        <AdminKpi label="Kitchen" value={String(c("KITCHEN"))} />
      </section>

      <form className="flex flex-wrap gap-2" action="/admin/users">
        <input name="q" defaultValue={term} placeholder="Search name, email or mobile" aria-label="Search users" className="min-h-11 flex-1 rounded-xl border border-border bg-surface px-3 text-base outline-none focus:border-brand" />
        <select name="role" defaultValue={roleFilter ?? ""} aria-label="Role" className="min-h-11 rounded-xl border border-border bg-surface px-3 text-base">
          <option value="">All roles</option>
          {roles.map((r) => <option key={r} value={r}>{r[0] + r.slice(1).toLowerCase()}</option>)}
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wide text-muted">
            <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Mobile</th><th className="p-3">Shop · role</th><th className="p-3">Last seen</th><th className="p-3">Joined</th></tr>
          </thead>
          <tbody>
            {users.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted">No users found.</td></tr>}
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border align-top">
                <td className="p-3 font-semibold text-ink">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3 whitespace-nowrap">{u.phone ?? <span className="text-danger">missing</span>}</td>
                <td className="p-3">
                  {u.staff.length === 0 ? (
                    <span className="text-muted">No shop</span>
                  ) : (
                    u.staff.map((s) => (
                      <p key={s.business.id}>
                        <Link href={`/admin/shops/${s.business.id}`} className="font-semibold text-brand hover:underline">{s.business.name}</Link>
                        <span className="text-xs text-muted"> · {s.role}{s.status !== "ACTIVE" ? ` (${s.status})` : ""}</span>
                      </p>
                    ))
                  )}
                </td>
                <td className="p-3 whitespace-nowrap">{lastSeen(u.staff)}</td>
                <td className="p-3 whitespace-nowrap">{fmtIST(u.createdAt, false)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 500 && <p className="p-3 text-xs text-muted">Showing the newest 500 — search to narrow down.</p>}
      </div>
    </div>
  );
}

/** Most recent time any of this person's logins had Billo open; "Online" within 2 minutes. */
function lastSeen(staff: { lastSeenAt: Date | null }[]) {
  const t = Math.max(0, ...staff.map((s) => s.lastSeenAt?.getTime() ?? 0));
  if (!t) return <span className="text-muted">Never</span>;
  if (nowMs() - t < 2 * 60_000) return <span className="font-bold text-success">● Online</span>;
  return fmtIST(new Date(t));
}

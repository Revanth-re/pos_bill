import { prisma } from "@/lib/db/prisma";

/** Start of today and of this month in India time (server clocks run in UTC). */
export function istRanges(now = new Date()) {
  const IST = 330 * 60 * 1000;
  const local = new Date(now.getTime() + IST);
  const dayStart = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - IST);
  const monthStart = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - IST);
  return { dayStart, monthStart };
}

export interface OutletSummary {
  businessId: string;
  staffId: string;
  name: string;
  city: string | null;
  role: string;
  isCurrent: boolean;
  /** Only for outlets where this user is owner/manager. */
  today?: { sales: number; bills: number };
  month?: { sales: number; bills: number };
}

/** Every shop this login belongs to, with today's / this month's sales where the user may see them. */
export async function listOutlets(userId: string, currentBusinessId: string): Promise<OutletSummary[]> {
  const memberships = await prisma.staff.findMany({
    where: { userId, status: "ACTIVE" },
    select: { id: true, role: true, business: { select: { id: true, name: true, city: true } } },
    orderBy: { createdAt: "asc" },
  });
  const viewable = memberships.filter((m) => m.role === "OWNER" || m.role === "MANAGER").map((m) => m.business.id);
  const { dayStart, monthStart } = istRanges();
  const where = (since: Date) => ({ businessId: { in: viewable }, createdAt: { gte: since }, status: { notIn: ["CANCELLED", "REFUNDED"] as ("CANCELLED" | "REFUNDED")[] } });
  const [today, month] = viewable.length
    ? await Promise.all([
        prisma.invoice.groupBy({ by: ["businessId"], where: where(dayStart), _sum: { grandTotal: true }, _count: { _all: true } }),
        prisma.invoice.groupBy({ by: ["businessId"], where: where(monthStart), _sum: { grandTotal: true }, _count: { _all: true } }),
      ])
    : [[], []];
  const pick = (rows: typeof today, id: string) => {
    const r = rows.find((x) => x.businessId === id);
    return { sales: Number(r?._sum.grandTotal ?? 0), bills: r?._count._all ?? 0 };
  };
  return memberships.map((m) => ({
    businessId: m.business.id,
    staffId: m.id,
    name: m.business.name,
    city: m.business.city,
    role: m.role,
    isCurrent: m.business.id === currentBusinessId,
    ...(viewable.includes(m.business.id) ? { today: pick(today, m.business.id), month: pick(month, m.business.id) } : {}),
  }));
}

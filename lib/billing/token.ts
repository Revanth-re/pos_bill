import { prisma } from "@/lib/db/prisma";

/** Start of the local business day for a given date. */
export function dayStart(d: Date): Date {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  return s;
}

/**
 * Token number = the bill's position within its business day (1, 2, 3…).
 * Derived, never stored, so it needs no schema change and can't drift.
 */
export async function getTokenNumber(businessId: string, createdAt: Date): Promise<number> {
  return prisma.invoice.count({
    where: { businessId, createdAt: { gte: dayStart(createdAt), lte: createdAt } },
  });
}

/** Token numbers for many invoices at once (one query per distinct day). */
export async function getTokenMap(
  businessId: string,
  invoices: { id: string; createdAt: Date }[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const days = new Map<string, Date>();
  for (const inv of invoices) days.set(dayStart(inv.createdAt).toISOString(), dayStart(inv.createdAt));
  for (const start of days.values()) {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const ids = await prisma.invoice.findMany({
      where: { businessId, createdAt: { gte: start, lt: end } },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    ids.forEach((row, i) => map.set(row.id, i + 1));
  }
  return map;
}

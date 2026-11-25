import { prisma } from "@/lib/db/prisma";

/** Ask the owner for a star rating at most twice: after 10 bills, then after 20 bills. Never again after that. */
export const RATING_MILESTONES = [10, 20] as const;

/** The milestone to ask about now, or null. A rating OR a "Not now" both count as asked. */
export async function pendingRatingMilestone(businessId: string): Promise<number | null> {
  const [bills, asked] = await Promise.all([
    prisma.invoice.count({ where: { businessId, status: { notIn: ["CANCELLED", "REFUNDED"] } } }),
    prisma.auditLog.findMany({
      where: { businessId, action: { in: ["APP_RATING", "APP_RATING_SKIPPED"] } },
      select: { metadata: true },
    }),
  ]);
  const done = new Set(asked.map((a) => Number((a.metadata as { milestone?: number } | null)?.milestone)));
  if (done.size >= RATING_MILESTONES.length) return null;
  for (const m of RATING_MILESTONES) if (bills >= m && !done.has(m)) return m;
  return null;
}

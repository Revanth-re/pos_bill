/**
 * India time (IST, UTC+05:30) day boundaries for SERVER code.
 * Servers run in UTC, so `setHours(0,0,0,0)` there means 5:30 AM in India — wrong for
 * "today's sales", daily tokens and reports. Use these helpers instead.
 */
const IST_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight (IST) at the start of the India-calendar day containing `d`. */
export function istDayStart(d: Date = new Date()): Date {
  const local = new Date(d.getTime() + IST_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - IST_MS);
}

/** Last millisecond (IST) of the India-calendar day containing `d`. */
export function istDayEnd(d: Date = new Date()): Date {
  return new Date(istDayStart(d).getTime() + DAY_MS - 1);
}

/** Midnight (IST) `n` days before today (0 = today). */
export function istDaysAgoStart(n: number, from: Date = new Date()): Date {
  return new Date(istDayStart(from).getTime() - n * DAY_MS);
}

/** Midnight (IST) on the 1st of this month. */
export function istMonthStart(d: Date = new Date()): Date {
  const local = new Date(d.getTime() + IST_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - IST_MS);
}

/** "2026-10-30" → midnight IST of that date (for date pickers sent from the phone). */
export function istStartOfDateString(ymd: string): Date {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return istDayStart(new Date(ymd));
  return new Date(Date.UTC(y, m - 1, d) - IST_MS);
}

/** "2026-10-30" → last millisecond (IST) of that date. */
export function istEndOfDateString(ymd: string): Date {
  return new Date(istStartOfDateString(ymd).getTime() + DAY_MS - 1);
}

/** India-calendar date key "YYYY-MM-DD" for grouping (e.g. daily sales chart). */
export function istDateKey(d: Date): string {
  return new Date(d.getTime() + IST_MS).toISOString().slice(0, 10);
}

/** Hour of day in India (0–23), e.g. for peak-hour insights. */
export function istHour(d: Date): number {
  return new Date(d.getTime() + IST_MS).getUTCHours();
}

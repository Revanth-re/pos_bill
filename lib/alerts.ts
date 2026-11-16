/**
 * Emails the Billo team when something is badly wrong (database paused/down, app crashing).
 * Uses Resend (same as password-reset emails). Settings (Vercel → Environment Variables):
 *   ALERT_EMAIL     who gets alerts, e.g. you@gmail.com (comma-separate for several)
 *   RESEND_API_KEY  already used for reset codes
 *   EMAIL_FROM      optional sender, e.g. "Billo <alerts@getbillo.in>"
 * At most one email per problem every 30 minutes (per server instance), so you're not spammed.
 */
const EVERY_MS = 30 * 60 * 1000;
const lastSent = new Map<string, number>();
let dbWasDown = false;

export async function sendAlert(key: string, subject: string, text: string): Promise<boolean> {
  const to = (process.env.ALERT_EMAIL || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!to.length || !process.env.RESEND_API_KEY) return false;
  const now = Date.now();
  if (now - (lastSent.get(key) ?? 0) < EVERY_MS) return false;
  lastSent.set(key, now);
  const when = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Billo <no-reply@getbillo.in>",
      to,
      subject: `[Billo] ${subject}`,
      text: `${text}\n\nTime (IST): ${when}\nCheck: https://getbillo.in/api/health`,
    }),
  }).catch(() => null);
  if (!res?.ok) console.error("[alert] email failed", res?.status);
  return Boolean(res?.ok);
}

/** Plain-words reason from a database error. */
function explain(err: unknown) {
  const msg = String((err as Error)?.message ?? err ?? "");
  if (/tenant or user not found|project.*paused|ENOTFOUND|getaddrinfo/i.test(msg))
    return "The Supabase database looks PAUSED or unreachable. Open supabase.com → your project → click 'Resume project'.";
  if (/password authentication failed/i.test(msg)) return "Database password is wrong — check DATABASE_URL in Vercel.";
  if (/timeout|ETIMEDOUT|ECONNREFUSED|Connection terminated/i.test(msg))
    return "The database is not answering (timeout). Supabase may be paused, restarting or overloaded.";
  if (/too many (clients|connections)/i.test(msg)) return "The database has too many connections.";
  return "The app could not talk to the database.";
}

/** Call when a database call fails. Users can't use the app while this is happening. */
export async function alertDbDown(err: unknown, where: string) {
  dbWasDown = true;
  const msg = String((err as Error)?.message ?? err ?? "").slice(0, 400);
  await sendAlert(
    "db-down",
    "DATABASE DOWN — users can't open Billo",
    `${explain(err)}\n\nWhere: ${where}\nError: ${msg}`
  );
}

/** Call when a database call works again after a failure. */
export async function alertDbRecovered() {
  if (!dbWasDown) return;
  dbWasDown = false;
  lastSent.delete("db-down");
  await sendAlert("db-up", "Database is back up", "Billo can reach the database again. Users can bill normally.");
}

/** Billo team access (not shop owners). Set ADMIN_EMAILS in Vercel, comma-separated. */
export function isBilloAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

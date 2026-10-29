/**
 * Signed outlet switch. Only the server can create a valid switch (it needs AUTH_SECRET),
 * so a user can never forge access to a shop they don't belong to.
 * Works on the Edge runtime and Node (Web Crypto).
 */
export interface OutletClaim {
  userId: string;
  staffId: string;
  businessId: string;
  businessName: string;
  role: string;
  /** Expiry, ms since epoch (short-lived). */
  exp: number;
}

export interface SignedOutletSwitch {
  claim: OutletClaim;
  sig: string;
}

function secret(): string {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function payload(c: OutletClaim) {
  return [c.userId, c.staffId, c.businessId, c.businessName, c.role, c.exp].join("|");
}

async function hmac(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
  let bin = "";
  for (const b of sig) bin += String.fromCharCode(b);
  return btoa(bin);
}

export async function signOutletSwitch(claim: Omit<OutletClaim, "exp">): Promise<SignedOutletSwitch> {
  const full: OutletClaim = { ...claim, exp: Date.now() + 60_000 };
  return { claim: full, sig: await hmac(payload(full)) };
}

/** Returns the claim if the signature is valid, fresh, and for this logged-in user. */
export async function verifyOutletSwitch(raw: unknown, userId: string | undefined): Promise<OutletClaim | null> {
  if (!raw || typeof raw !== "object" || !userId) return null;
  const { claim, sig } = raw as Partial<SignedOutletSwitch>;
  if (!claim || typeof sig !== "string") return null;
  if (claim.userId !== userId || typeof claim.exp !== "number" || claim.exp < Date.now()) return null;
  const expected = await hmac(payload(claim));
  // constant-time-ish compare
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0 ? claim : null;
}

import { createHash, randomInt, randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";

/**
 * Login protection + password-reset codes, stored in the existing `verification_tokens`
 * table (no schema change). Server-only.
 */
const MIN = 60 * 1000;
export const LOCK_AFTER_FAILS = 5;
export const LOCK_WINDOW_MS = 15 * MIN;
const OTP_TTL_MS = 10 * MIN;
const OTP_MAX_TRIES = 5;
const OTP_MAX_SENDS = 3; // per 15 minutes

const norm = (email: string) => email.trim().toLowerCase();
const failId = (email: string) => `login-fail:${norm(email)}`;
const otpId = (email: string) => `pw-reset:${norm(email)}`;
const otpTryId = (email: string) => `pw-reset-try:${norm(email)}`;

async function countActive(identifier: string) {
  return prisma.verificationToken.count({ where: { identifier, expires: { gt: new Date() } } });
}
async function addMark(identifier: string, ttlMs: number, token: string = randomUUID()) {
  await prisma.verificationToken.create({ data: { identifier, token, expires: new Date(Date.now() + ttlMs) } });
}
async function clear(identifier: string) {
  await prisma.verificationToken.deleteMany({ where: { identifier } });
}

// ---------- Login lock ----------
export async function isLoginLocked(email: string): Promise<boolean> {
  return (await countActive(failId(email))) >= LOCK_AFTER_FAILS;
}
export async function recordFailedLogin(email: string) {
  await addMark(failId(email), LOCK_WINDOW_MS);
  // Housekeeping: drop expired marks now and then.
  if (Math.random() < 0.05) await prisma.verificationToken.deleteMany({ where: { expires: { lt: new Date() }, identifier: { startsWith: "login-fail:" } } });
}
export async function clearFailedLogins(email: string) {
  await clear(failId(email));
}

// ---------- Password reset code ----------
function hashOtp(email: string, otp: string) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
  return createHash("sha256").update(`${norm(email)}|${otp}|${secret}`).digest("hex");
}

/** Creates a 6-digit code (or null if too many were sent recently). */
export async function createResetOtp(email: string): Promise<string | null> {
  const sends = await prisma.verificationToken.count({
    where: { identifier: otpId(email), expires: { gt: new Date(Date.now() - LOCK_WINDOW_MS + OTP_TTL_MS) } },
  });
  if (sends >= OTP_MAX_SENDS) return null;
  const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await clear(otpTryId(email));
  await addMark(otpId(email), OTP_TTL_MS, hashOtp(email, otp) + ":" + randomUUID().slice(0, 8));
  return otp;
}

export type OtpResult = "ok" | "wrong" | "expired" | "too-many";

export async function verifyResetOtp(email: string, otp: string): Promise<OtpResult> {
  if ((await countActive(otpTryId(email))) >= OTP_MAX_TRIES) return "too-many";
  const rows = await prisma.verificationToken.findMany({ where: { identifier: otpId(email), expires: { gt: new Date() } } });
  if (rows.length === 0) return "expired";
  const want = hashOtp(email, otp.trim());
  if (rows.some((r) => r.token.split(":")[0] === want)) {
    await clear(otpId(email));
    await clear(otpTryId(email));
    return "ok";
  }
  await addMark(otpTryId(email), OTP_TTL_MS);
  return "wrong";
}

// ---------- Email ----------
export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Sends the code with Resend (https://resend.com). Needs RESEND_API_KEY (+ EMAIL_FROM on a verified domain). */
export async function sendResetEmail(email: string, otp: string): Promise<boolean> {
  if (!emailConfigured()) return false;
  const from = process.env.EMAIL_FROM || "Billo <no-reply@getbillo.in>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `${otp} is your Billo password reset code`,
      text: `Your Billo password reset code is ${otp}.\n\nIt is valid for 10 minutes. If you didn't ask for this, ignore this email.`,
      html: `<div style="font-family:sans-serif;font-size:16px;color:#172020"><p>Your Billo password reset code is</p><p style="font-size:32px;font-weight:800;letter-spacing:6px;color:#075E63">${otp}</p><p>It is valid for 10 minutes. If you didn't ask for this, ignore this email.</p></div>`,
    }),
  }).catch(() => null);
  if (!res?.ok) console.error("Reset email failed:", res?.status, await res?.text().catch(() => ""));
  return Boolean(res?.ok);
}

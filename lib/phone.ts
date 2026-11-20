/**
 * Indian mobile numbers. Accepts "98765 43210", "+91 98765-43210", "098765 43210", "919876543210".
 * Valid = 10 digits starting with 6, 7, 8 or 9 (all Indian mobile numbers), and not an obvious fake.
 * Stored as "+91XXXXXXXXXX".
 */
export function normalizeIndianMobile(input: string): string | null {
  let d = (input || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (!/^[6-9]\d{9}$/.test(d)) return null;
  if (/^(\d)\1{9}$/.test(d)) return null; // 9999999999
  if (["9876543210", "6789012345", "9123456789", "9012345678"].includes(d)) return null; // common fake entries
  return `+91${d}`;
}

export const MOBILE_ERROR = "Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8 or 9).";

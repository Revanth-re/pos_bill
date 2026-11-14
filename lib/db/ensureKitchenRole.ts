import { prisma } from "@/lib/db/prisma";

let done = false;

/**
 * Adds the KITCHEN value to the StaffRole enum in the database if it isn't there yet,
 * so the owner can create kitchen logins without running any SQL by hand.
 * Safe to call many times (IF NOT EXISTS). Runs on its own, outside any transaction.
 */
export async function ensureKitchenRole() {
  if (done) return;
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "StaffRole" ADD VALUE IF NOT EXISTS 'KITCHEN'`);
    done = true;
  } catch (e) {
    console.error("[ensureKitchenRole] could not add KITCHEN role — run prisma/migrations/20261114120000_kitchen_role/migration.sql in Supabase", e);
  }
}

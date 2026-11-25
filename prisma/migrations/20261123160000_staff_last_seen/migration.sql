-- "Online now" on the admin panel: when each login last had Billo open.
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "lastSeenPath" TEXT;
CREATE INDEX IF NOT EXISTS "staff_lastSeenAt_idx" ON "staff"("lastSeenAt");

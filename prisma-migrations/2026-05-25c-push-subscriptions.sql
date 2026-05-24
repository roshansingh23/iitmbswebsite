-- Web Push subscriptions. One row per (user, browser/device pair).
-- Endpoint is unique because the same subscription can't belong to two
-- users; if a user signs in on a device that was previously another
-- user's, the endpoint upsert resassigns it.
CREATE TABLE IF NOT EXISTS "PushSubscription" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "endpoint"    TEXT NOT NULL UNIQUE,
  "p256dh"      TEXT NOT NULL,
  "auth"        TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx"
  ON "PushSubscription"("userId");
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;

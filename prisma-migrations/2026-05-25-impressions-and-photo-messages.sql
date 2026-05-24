-- Impression: per-(viewer, candidate) row, refreshed on each render of the
-- candidate in the deck. Used to hard-exclude profiles shown to the viewer
-- in the last 24h so the deck always feels fresh.
CREATE TABLE IF NOT EXISTS "Impression" (
  "id"            TEXT PRIMARY KEY,
  "viewerId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "candidateId"   TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "lastShownAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Impression_viewerId_candidateId_key" UNIQUE ("viewerId", "candidateId")
);
CREATE INDEX IF NOT EXISTS "Impression_viewerId_lastShownAt_idx"
  ON "Impression"("viewerId", "lastShownAt" DESC);
ALTER TABLE "Impression" ENABLE ROW LEVEL SECURITY;

-- Ephemeral photo messages: extend Message with a type discriminator + photo
-- columns. body becomes nullable so text-only rows stay clean and photo-only
-- rows can have body=NULL.
ALTER TABLE "Message" ALTER COLUMN "body" DROP NOT NULL;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "messageType"     TEXT NOT NULL DEFAULT 'text';
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "photoUrl"        TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "photoPublicId"   TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "viewsRemaining"  INTEGER;

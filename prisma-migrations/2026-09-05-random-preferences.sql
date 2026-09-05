-- ═══════════════════════════════════════════════════════════════════════
-- Stated preferences for random pairing.
--
-- These are captured now and stored, but NOTHING reads them yet: the
-- matchmaker still pairs inside one pool with no gender filter. Wiring
-- them changes the shape of the queue in ways worth designing on purpose
-- (see the note below), so the columns land first and the algorithm
-- follows.
--
-- Safe to re-run.
-- Apply with: node scripts/apply-migration.mjs 2026-09-05-random-preferences.sql
-- ═══════════════════════════════════════════════════════════════════════

-- 'anyone' | 'women' | 'men'
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "randomPrefGender" text NOT NULL DEFAULT 'anyone';

-- 'same' | 'different' | 'any'
--
-- Note for whoever wires this up: 'different' and 'any' require the
-- matchmaker to pair ACROSS poolId, which pair_random() deliberately never
-- does today — the pool boundary is currently a hard rule, not a
-- preference. Turning it into a preference means the WHERE clause has to
-- consider both sides' choices (two people who both asked for 'same' must
-- not be crossed, and a 'different' request only matches someone who is
-- also open to it), otherwise the queue quietly stops being symmetric.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "randomPrefWorkspace" text NOT NULL DEFAULT 'same';

COMMENT ON COLUMN "User"."randomPrefGender" IS
  'Stated random-chat preference. Not yet read by pair_random().';
COMMENT ON COLUMN "User"."randomPrefWorkspace" IS
  'Stated random-chat preference. Not yet read by pair_random(); crossing pools is not implemented.';

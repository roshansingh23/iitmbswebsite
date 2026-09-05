-- ═══════════════════════════════════════════════════════════════════════
-- Interests (soft pairing signal), pool scoping for confessions, and
-- "tell me when someone is around" pings.
--
-- Safe to re-run.
-- Apply with: node scripts/apply-migration.mjs 2026-09-02c-interests-scoping-and-pings.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Interests ───────────────────────────────────────────────────────
-- A plain array rather than a join table: the matchmaker reads it on every
-- pairing attempt and an array overlap stays inside the same row.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}';

-- GIN so the overlap operator can use an index once pools get big.
CREATE INDEX IF NOT EXISTS "User_interests_idx" ON "User" USING GIN (interests);

-- ── 2. Confessions scoped to a pool ────────────────────────────────────

ALTER TABLE "Confession" ADD COLUMN IF NOT EXISTS "poolId" text;

CREATE INDEX IF NOT EXISTS "Confession_pool_idx"
  ON "Confession"("poolId", approved, "createdAt" DESC);

-- Backfill from each author's domain.
UPDATE "Confession" c
   SET "poolId" = d."poolId"
  FROM "User" u
  JOIN "Domain" d ON d.id = u."domainId"
 WHERE c."authorId" = u.id
   AND c."poolId" IS NULL;

-- ── 2b. Reports can point at a random-chat message ─────────────────────
-- "Report"."targetMessageId" has a foreign key to "Message"; a random
-- message lives in its own table, so it needs its own column rather than
-- being smuggled through that one.

ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "targetRandomMessageId" text;

DO $$ BEGIN
  ALTER TABLE "Report"
    ADD CONSTRAINT "Report_targetRandomMessageId_fkey"
    FOREIGN KEY ("targetRandomMessageId")
    REFERENCES "RandomMessage"(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "Report_targetRandomMessage_idx"
  ON "Report"("targetRandomMessageId");

-- ── 3. Pings ───────────────────────────────────────────────────────────
-- Someone who found an empty queue can ask to be told when the pool wakes
-- up. One row per person; consumed (deleted) when the push goes out.

CREATE TABLE IF NOT EXISTS "RandomPing" (
  "userId"    text PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
  "poolId"    text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "RandomPing_pool_idx" ON "RandomPing"("poolId");

ALTER TABLE "RandomPing" ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. Matchmaker: add shared interests as a SOFT signal.
--
-- Deliberately not strict. Interests only reorder the queue — they never
-- appear in the WHERE clause, so nobody is ever excluded from being paired
-- for having the wrong tags or none at all. The bonus is capped at 6 so
-- that waiting time (0.1/sec) overtakes it after about a minute and the
-- longest waiter still gets served.
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION pair_random(
  p_user_id       text,
  p_pool_id       text,
  p_stale_secs    integer DEFAULT 25,
  p_cooldown_mins integer DEFAULT 45
)
RETURNS text
LANGUAGE plpgsql
AS $fn$
DECLARE
  v_now          timestamptz := now();
  v_stale        timestamptz := now() - make_interval(secs => p_stale_secs);
  v_cooldown     timestamptz := now() - make_interval(mins => p_cooldown_mins);
  v_partner      text;
  v_session      text;
  v_my_age       integer;
  v_my_intent    text;
  v_my_interests text[];
BEGIN
  -- Sweep abandoned waiters (closed tabs) before anything else, so we
  -- never pair someone against a browser that went away.
  DELETE FROM "RandomQueue"
   WHERE state = 'waiting' AND "heartbeatAt" < v_stale;

  -- Am I already paired? Idempotent: the client polls this endpoint, and
  -- a poll after the match landed must return the same session.
  --
  -- Only if that session is still live, though. endSession() clears these
  -- rows on the normal path, but a session deleted any other way (a purge,
  -- a cascade from a deleted account) would otherwise strand the queue row
  -- as 'paired' and keep handing this user a dead room forever. Drop the
  -- stale row and fall through to pairing them again.
  SELECT "sessionId" INTO v_session
    FROM "RandomQueue"
   WHERE "userId" = p_user_id AND state = 'paired';
  IF v_session IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM "RandomSession"
       WHERE id = v_session AND "endedAt" IS NULL
    ) THEN
      RETURN v_session;
    END IF;
    DELETE FROM "RandomQueue" WHERE "userId" = p_user_id;
    v_session := NULL;
  END IF;

  -- Enter (or refresh) my own place in the queue.
  INSERT INTO "RandomQueue" AS q ("userId","poolId",state,"joinedAt","heartbeatAt")
  VALUES (p_user_id, p_pool_id, 'waiting', v_now, v_now)
  ON CONFLICT ("userId") DO UPDATE
     SET "heartbeatAt" = v_now,
         "poolId"      = EXCLUDED."poolId",
         state         = 'waiting',
         "sessionId"   = NULL,
         -- Keep the original joinedAt so a poll does not reset my place in
         -- line — otherwise polling would starve me forever.
         "joinedAt"    = LEAST(q."joinedAt", v_now);

  -- Lock my own row for the rest of the transaction. Two concurrent calls
  -- for the same user serialise here instead of both pairing me.
  PERFORM 1 FROM "RandomQueue" WHERE "userId" = p_user_id FOR UPDATE;

  SELECT age, intentions, coalesce(interests, '{}')
    INTO v_my_age, v_my_intent, v_my_interests
    FROM "User" WHERE id = p_user_id;

  -- Pick a partner. Scoring, in order of weight:
  --   • waiting time     — 0.1/sec, so nobody starves; after ~a minute this
  --                        dominates and the longest waiter gets served
  --   • shared interests — 2 each, capped at 6. SOFT: never a filter
  --   • same intentions  — +3
  --   • age within 3 / 6 — +2 / +1
  --   • jitter           — 0–2, so a thin queue still feels random
  SELECT q."userId" INTO v_partner
    FROM "RandomQueue" q
    JOIN "User" u ON u.id = q."userId"
   WHERE q."poolId"  = p_pool_id
     AND q.state     = 'waiting'
     AND q."userId" <> p_user_id
     AND q."heartbeatAt" >= v_stale
     AND u.paused = false
     -- Never pair across a block, in either direction.
     AND NOT EXISTS (
       SELECT 1 FROM "Block" b
        WHERE (b."fromUserId" = p_user_id AND b."toUserId" = q."userId")
           OR (b."fromUserId" = q."userId" AND b."toUserId" = p_user_id)
     )
     -- Cooldown: do not hand someone the same stranger twice in an hour.
     AND NOT EXISTS (
       SELECT 1 FROM "RandomSession" s
        WHERE s."startedAt" > v_cooldown
          AND ((s."userAId" = p_user_id AND s."userBId" = q."userId")
            OR (s."userAId" = q."userId" AND s."userBId" = p_user_id))
     )
   ORDER BY
     (EXTRACT(EPOCH FROM (v_now - q."joinedAt")) * 0.1)
     + LEAST(
         6,
         2 * coalesce(
           cardinality(
             ARRAY(SELECT unnest(coalesce(u.interests,'{}'))
                   INTERSECT
                   SELECT unnest(v_my_interests))
           ), 0)
       )
     + (CASE WHEN v_my_intent IS NOT NULL AND u.intentions = v_my_intent THEN 3 ELSE 0 END)
     + (CASE
          WHEN v_my_age IS NULL OR u.age IS NULL THEN 0
          WHEN abs(u.age - v_my_age) <= 3 THEN 2
          WHEN abs(u.age - v_my_age) <= 6 THEN 1
          ELSE 0
        END)
     + (random() * 2)
     DESC
   LIMIT 1
   FOR UPDATE OF q SKIP LOCKED;

  IF v_partner IS NULL THEN
    RETURN NULL;   -- nobody about; the client keeps waiting
  END IF;

  v_session := 'rs' || replace(gen_random_uuid()::text, '-', '');

  INSERT INTO "RandomSession" (id,"poolId","userAId","userBId","startedAt")
  VALUES (v_session, p_pool_id, p_user_id, v_partner, v_now);

  UPDATE "RandomQueue"
     SET state = 'paired', "sessionId" = v_session
   WHERE "userId" IN (p_user_id, v_partner);

  -- Whoever was waiting to hear that the pool woke up no longer needs to:
  -- these two are already talking.
  DELETE FROM "RandomPing" WHERE "userId" IN (p_user_id, v_partner);

  RETURN v_session;
END $fn$;

-- ═══════════════════════════════════════════════════════════════════════
-- 5. Retention sweep, corrected for the new report column.
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION purge_random_sessions(p_retention_days integer DEFAULT 7)
RETURNS integer
LANGUAGE plpgsql
AS $fn$
DECLARE v_deleted integer;
BEGIN
  WITH gone AS (
    DELETE FROM "RandomSession" s
     WHERE s."endedAt" IS NOT NULL
       AND s."endedAt" < now() - make_interval(days => p_retention_days)
       AND s."keptByA" = false
       AND s."keptByB" = false
       -- Never drop a session that has an open report against it.
       AND NOT EXISTS (
         SELECT 1
           FROM "Report" r
           JOIN "RandomMessage" m ON m.id = r."targetRandomMessageId"
          WHERE r.status = 'open'
            AND m."sessionId" = s.id
       )
    RETURNING 1
  )
  SELECT count(*) INTO v_deleted FROM gone;
  RETURN v_deleted;
END $fn$;

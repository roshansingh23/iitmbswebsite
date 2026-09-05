-- ═══════════════════════════════════════════════════════════════════════
-- Domain-scoped membership + random chat (the new primary feature).
--
-- Members are grouped by the BASE domain they sign in with — one row per
-- institution, not per subdomain, so ds.study.x.ac.in and smail.x.ac.in
-- both land on x.ac.in. Nothing in here derives an institution NAME from a
-- domain: Domain.name stays null until a human sets it, and the UI shows
-- the base domain until then.
--
-- Safe to re-run: every statement is guarded.
-- Apply with: node scripts/apply-migration.mjs 2026-09-02-domains-and-random-chat.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Domains ─────────────────────────────────────────────────────────

-- Collapse a sign-in domain to the institution that owns it: the single
-- label in front of the public suffix. Mirrors baseDomain() in
-- lib/domains.ts — keep the two suffix lists in step.
--
--   ds.study.iitm.ac.in  ->  iitm.ac.in
--   students.nitt.edu    ->  nitt.edu
--
-- A non-academic domain falls back to its last two labels.
CREATE OR REPLACE FUNCTION base_domain(p_domain text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $fn$
DECLARE
  v_suffixes text[] := ARRAY[
    'edu',
    'ac.in','edu.in','res.in',
    'ac.uk',
    'edu.au','ac.nz',
    'ac.jp','edu.sg','edu.my','ac.kr',
    'edu.pk','edu.bd','edu.np','ac.lk',
    'edu.cn','ac.za','edu.br','edu.mx'
  ];
  v_d      text := lower(btrim(coalesce(p_domain, '')));
  v_best   text := NULL;
  v_s      text;
  v_stem   text;
  v_labels text[];
  v_n      integer;
BEGIN
  IF v_d = '' THEN RETURN NULL; END IF;

  -- Longest matching suffix wins, so x.edu.in resolves against edu.in
  -- rather than being read as a subdomain under edu.
  FOREACH v_s IN ARRAY v_suffixes LOOP
    IF v_d = v_s OR v_d LIKE ('%.' || v_s) THEN
      IF v_best IS NULL OR length(v_s) > length(v_best) THEN
        v_best := v_s;
      END IF;
    END IF;
  END LOOP;

  IF v_best IS NULL THEN
    v_labels := string_to_array(v_d, '.');
    v_n := array_length(v_labels, 1);
    IF v_n IS NULL OR v_n <= 2 THEN RETURN v_d; END IF;
    RETURN v_labels[v_n - 1] || '.' || v_labels[v_n];
  END IF;

  IF v_d = v_best THEN RETURN v_d; END IF;

  v_stem   := left(v_d, length(v_d) - length(v_best) - 1);
  v_labels := string_to_array(v_stem, '.');
  v_n      := array_length(v_labels, 1);
  IF v_n IS NULL OR v_n = 0 THEN RETURN v_d; END IF;
  RETURN v_labels[v_n] || '.' || v_best;
END $fn$;

CREATE TABLE IF NOT EXISTS "Domain" (
  id          text PRIMARY KEY,
  -- The BASE domain, lowercase. One row per institution.
  domain      text NOT NULL UNIQUE,
  -- Display name. Null = show the base domain.
  name        text,
  -- Pairing pool. Defaults to the row's own id, so each domain is its own
  -- pool. Point several rows at one id to merge them:
  --   UPDATE "Domain" SET "poolId" = '<keeper id>' WHERE domain IN (...);
  "poolId"    text NOT NULL,
  verified    boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Domain_poolId_idx" ON "Domain"("poolId");

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "domainId" text;

DO $$ BEGIN
  ALTER TABLE "User"
    ADD CONSTRAINT "User_domainId_fkey"
    FOREIGN KEY ("domainId") REFERENCES "Domain"(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "User_domainId_idx" ON "User"("domainId");

-- Backfill: one Domain row per distinct BASE domain already in the User
-- table, each its own pool. Members on different subdomains of the same
-- institution collapse onto one row. No re-login needed.
INSERT INTO "Domain" (id, domain, name, "poolId")
SELECT ids.id, ids.domain, NULL, ids.id
  FROM (
    SELECT 'dm' || replace(gen_random_uuid()::text, '-', '') AS id,
           d.domain
      FROM (
        SELECT DISTINCT base_domain(split_part(lower(email), '@', 2)) AS domain
          FROM "User"
         WHERE email LIKE '%@%'
      ) d
     WHERE d.domain IS NOT NULL
  ) ids
ON CONFLICT (domain) DO NOTHING;

UPDATE "User" u
   SET "domainId" = d.id
  FROM "Domain" d
 WHERE u."domainId" IS NULL
   AND d.domain = base_domain(split_part(lower(u.email), '@', 2));

-- ── 2. Enums ───────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "RandomQueueState" AS ENUM ('waiting','paired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RandomEndReason" AS ENUM ('left','skipped','reported','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Reports can now target a random-chat message.
DO $$ BEGIN
  ALTER TYPE "ReportTargetType" ADD VALUE IF NOT EXISTS 'random_message';
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- ── 3. Random chat tables ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "RandomQueue" (
  "userId"      text PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
  -- Denormalised Domain.poolId so the matchmaker never joins to resolve it.
  "poolId"      text NOT NULL,
  state         "RandomQueueState" NOT NULL DEFAULT 'waiting',
  "sessionId"   text,
  "joinedAt"    timestamptz NOT NULL DEFAULT now(),
  "heartbeatAt" timestamptz NOT NULL DEFAULT now()
);

-- The matchmaker's only scan: waiting rows in one pool, beating recently.
CREATE INDEX IF NOT EXISTS "RandomQueue_pool_idx"
  ON "RandomQueue"("poolId", state, "heartbeatAt");
-- The stale sweep scans across pools.
CREATE INDEX IF NOT EXISTS "RandomQueue_sweep_idx"
  ON "RandomQueue"(state, "heartbeatAt");

CREATE TABLE IF NOT EXISTS "RandomSession" (
  id               text PRIMARY KEY,
  "poolId"         text NOT NULL,
  "userAId"        text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "userBId"        text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "startedAt"      timestamptz NOT NULL DEFAULT now(),
  "endedAt"        timestamptz,
  "endedById"      text,
  "endReason"      "RandomEndReason",
  "keptByA"        boolean NOT NULL DEFAULT false,
  "keptByB"        boolean NOT NULL DEFAULT false,
  "revealAskedByA" boolean NOT NULL DEFAULT false,
  "revealAskedByB" boolean NOT NULL DEFAULT false,
  "conversationId" text UNIQUE,
  "messageCount"   integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "RandomSession_userA_idx" ON "RandomSession"("userAId","startedAt" DESC);
CREATE INDEX IF NOT EXISTS "RandomSession_userB_idx" ON "RandomSession"("userBId","startedAt" DESC);
CREATE INDEX IF NOT EXISTS "RandomSession_endedAt_idx" ON "RandomSession"("endedAt");
-- Cooldown lookup: have these two already talked recently?
CREATE INDEX IF NOT EXISTS "RandomSession_pair_idx" ON "RandomSession"("userAId","userBId","startedAt" DESC);

CREATE TABLE IF NOT EXISTS "RandomMessage" (
  id           text PRIMARY KEY,
  "sessionId"  text NOT NULL REFERENCES "RandomSession"(id) ON DELETE CASCADE,
  "fromUserId" text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  body         text NOT NULL,
  "createdAt"  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "RandomMessage_session_idx"
  ON "RandomMessage"("sessionId","createdAt");

ALTER TABLE "Domain"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RandomQueue"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RandomSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RandomMessage" ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. The matchmaker.
--
-- Everything happens inside one function so two people hitting "connect"
-- in the same millisecond cannot claim the same partner. The classic
-- queue pattern: SELECT ... FOR UPDATE SKIP LOCKED means a row already
-- being claimed by another transaction is invisible to this one rather
-- than blocking it.
--
-- Returns the session id when paired, NULL when still waiting.
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
  v_now       timestamptz := now();
  v_stale     timestamptz := now() - make_interval(secs => p_stale_secs);
  v_cooldown  timestamptz := now() - make_interval(mins => p_cooldown_mins);
  v_partner   text;
  v_session   text;
  v_my_age    integer;
  v_my_intent text;
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

  SELECT age, intentions INTO v_my_age, v_my_intent
    FROM "User" WHERE id = p_user_id;

  -- Pick a partner. Scoring, in order of weight:
  --   • waiting time  — 0.1/sec, so nobody starves; after ~a minute this
  --                     dominates and the longest waiter gets served
  --   • same intentions            +3
  --   • age within 3 / within 6    +2 / +1
  --   • jitter                     0–2, so a thin queue still feels random
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

  RETURN v_session;
END $fn$;

-- ═══════════════════════════════════════════════════════════════════════
-- 5. Retention sweep.
--
-- A session either side chose to keep lives forever. Everything else is
-- deleted after the retention window — long enough that a report filed
-- the next morning still has the messages attached to it.
-- Run from a daily cron (Supabase scheduled function or Vercel cron).
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
         SELECT 1 FROM "Report" r
          WHERE r."targetType" = 'random_message'
            AND r.status = 'open'
            AND r."targetMessageId" IN (
              SELECT m.id FROM "RandomMessage" m WHERE m."sessionId" = s.id
            )
       )
    RETURNING 1
  )
  SELECT count(*) INTO v_deleted FROM gone;
  RETURN v_deleted;
END $fn$;

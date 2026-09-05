-- ═══════════════════════════════════════════════════════════════════════
-- How many people from your pool are around, and how many of them share
-- an interest with you.
--
-- Counting the QUEUE would be useless here, and it is worth writing down
-- why: pair_random() hands you any waiting person in the pool, so the only
-- reasons it returns "still waiting" while others are queued are a block,
-- the re-pair cooldown, a paused account, or a stale row — all of which a
-- pairable-count would also have to exclude. The number on the searching
-- screen would therefore be zero every single time it was displayed.
--
-- So this counts presence instead: members of the pool seen recently. That
-- is what "24 online" means to a reader, and it is a number that moves.
--
-- Note on the window: lastSeenAt is debounced to five minutes in
-- lib/session.ts, so someone active right now can carry a timestamp up to
-- five minutes old. The default window is ten minutes to cover that.
--
-- Safe to re-run.
-- Apply with: node scripts/apply-migration.mjs 2026-09-05b-online-counts.sql
-- ═══════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS waiting_counts(text, text, integer, integer);

CREATE OR REPLACE FUNCTION online_counts(
  p_user_id     text,
  p_pool_id     text,
  p_window_mins integer DEFAULT 10
)
RETURNS TABLE (online integer, shared integer)
LANGUAGE plpgsql
STABLE
AS $fn$
DECLARE
  v_since        timestamptz := now() - make_interval(mins => p_window_mins);
  v_my_interests text[];
BEGIN
  SELECT coalesce(interests, '{}') INTO v_my_interests
    FROM "User" WHERE id = p_user_id;

  RETURN QUERY
  SELECT
    count(*)::int AS online,
    -- && is array overlap: at least one tag in common.
    count(*) FILTER (
      WHERE coalesce(u.interests, '{}') && coalesce(v_my_interests, '{}')
    )::int AS shared
  FROM "User" u
  JOIN "Domain" d ON d.id = u."domainId"
  WHERE d."poolId" = p_pool_id
    AND u.id <> p_user_id
    AND u.paused = false
    AND u."lastSeenAt" IS NOT NULL
    AND u."lastSeenAt" >= v_since;
END $fn$;

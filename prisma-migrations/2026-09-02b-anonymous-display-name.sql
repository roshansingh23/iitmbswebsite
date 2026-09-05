-- ═══════════════════════════════════════════════════════════════════════
-- Anonymous display names for random chat.
--
-- "User"."name" keeps holding the real name from Google — it is never sent
-- to the other side of an anonymous chat, only after a mutual reveal.
-- "displayName" is the handle the member picks for themselves, and is the
-- only name a stranger ever sees.
--
-- Nullable on purpose: a member who has not picked one falls back to a
-- generated per-session alias, so nobody is blocked from chatting.
--
-- Safe to re-run.
-- Apply with: node scripts/apply-migration.mjs 2026-09-02b-anonymous-display-name.sql
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "displayName" text;

-- Deliberately NOT unique. Two people may both call themselves the same
-- thing; forcing uniqueness would turn the handle into a stable identifier
-- that can be probed for, which is the opposite of what it is for.
COMMENT ON COLUMN "User"."displayName" IS
  'Self-chosen anonymous handle shown in random chat. Real name lives in "name" and is only disclosed on mutual reveal.';

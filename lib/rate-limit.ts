import { supabaseAdmin } from "./supabase-server";

// Per-user, per-action rate limits enforced by counting rows in the
// relevant table over a rolling window. No extra storage needed because we
// already write Hook / Pass / Message rows on every action.
//
// Free-tier-friendly: each rate check is one cheap COUNT query.

type LimitConfig = {
  table: string;
  column: string;
  windowMs: number;
  max: number;
  message: string;
};

const LIMITS: Record<string, LimitConfig> = {
  hook: {
    table: "Hook",
    column: "fromUserId",
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30,
    message: "You're sending matches too fast. Try again in a few minutes."
  },
  pass: {
    table: "Pass",
    column: "fromUserId",
    windowMs: 60 * 60 * 1000,
    max: 100,
    message: "Slow down on the X button."
  },
  message: {
    table: "Message",
    column: "fromUserId",
    windowMs: 60 * 60 * 1000,
    max: 200,
    message: "Too many messages too fast. Wait a moment."
  },
  // Random chat. The pair limit is deliberately generous — skipping through
  // strangers is the core loop — but it stops a script from churning the
  // queue and mapping out who is online.
  random_pair: {
    table: "RandomSession",
    column: "userAId",
    windowMs: 60 * 60 * 1000,
    max: 120,
    message: "You're connecting very fast. Take a breath and try again shortly."
  },
  random_message: {
    table: "RandomMessage",
    column: "fromUserId",
    windowMs: 60 * 60 * 1000,
    max: 400,
    message: "Too many messages too fast. Wait a moment."
  }
};

export async function checkRateLimit(action: keyof typeof LIMITS, userId: string)
  : Promise<{ ok: true } | { ok: false; reason: string }> {
  const cfg = LIMITS[action];
  if (!cfg) return { ok: true };
  const admin = supabaseAdmin();
  if (!admin) return { ok: true }; // fail-open if admin client not configured

  // RandomSession stamps its clock as startedAt; every other table uses
  // createdAt. Same rolling-window count either way.
  const timeColumn = cfg.table === "RandomSession" ? "startedAt" : "createdAt";
  const since = new Date(Date.now() - cfg.windowMs).toISOString();
  const { count, error } = await admin
    .from(cfg.table)
    .select(cfg.table === "RandomQueue" ? "userId" : "id", { count: "exact", head: true })
    .eq(cfg.column, userId)
    .gte(timeColumn, since);

  if (error) return { ok: true }; // fail-open on DB error
  if ((count ?? 0) >= cfg.max) return { ok: false, reason: cfg.message };
  return { ok: true };
}

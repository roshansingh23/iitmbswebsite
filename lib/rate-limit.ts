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
  }
};

export async function checkRateLimit(action: keyof typeof LIMITS, userId: string)
  : Promise<{ ok: true } | { ok: false; reason: string }> {
  const cfg = LIMITS[action];
  if (!cfg) return { ok: true };
  const admin = supabaseAdmin();
  if (!admin) return { ok: true }; // fail-open if admin client not configured

  const since = new Date(Date.now() - cfg.windowMs).toISOString();
  const { count, error } = await admin
    .from(cfg.table)
    .select("id", { count: "exact", head: true })
    .eq(cfg.column, userId)
    .gte("createdAt", since);

  if (error) return { ok: true }; // fail-open on DB error
  if ((count ?? 0) >= cfg.max) return { ok: false, reason: cfg.message };
  return { ok: true };
}

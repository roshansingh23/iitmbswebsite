import { supabaseAdmin } from "./supabase-server";

// ──────────────────────────────────────────────────────────────────────────
// Random-chat server helpers.
//
// A RandomSession is anonymous by construction: neither side is ever sent
// the other's user id, name, or photos. They get a per-session alias, and
// only a mutual reveal turns the session into a real Conversation.
// ──────────────────────────────────────────────────────────────────────────

export type Side = "A" | "B";

export type SessionRow = {
  id: string;
  poolId: string;
  userAId: string;
  userBId: string;
  startedAt: string;
  endedAt: string | null;
  endedById: string | null;
  endReason: string | null;
  keptByA: boolean;
  keptByB: boolean;
  revealAskedByA: boolean;
  revealAskedByB: boolean;
  conversationId: string | null;
  messageCount: number;
};

export function newId(prefix: string): string {
  return prefix + globalThis.crypto.randomUUID().replace(/-/g, "");
}

export function sideOf(s: Pick<SessionRow, "userAId" | "userBId">, userId: string): Side | null {
  if (s.userAId === userId) return "A";
  if (s.userBId === userId) return "B";
  return null;
}

export function partnerIdOf(s: Pick<SessionRow, "userAId" | "userBId">, userId: string): string | null {
  const side = sideOf(s, userId);
  if (!side) return null;
  return side === "A" ? s.userBId : s.userAId;
}

// Load a session and confirm the caller is one of its two participants.
// Every random route funnels through this — there is no other way in.
export async function loadSessionFor(sessionId: string, userId: string): Promise<
  { session: SessionRow; side: Side } | null
> {
  const admin = supabaseAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("RandomSession")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (!data) return null;
  const side = sideOf(data as SessionRow, userId);
  if (!side) return null;
  return { session: data as SessionRow, side };
}

// ── Aliases ───────────────────────────────────────────────────────────────
// The stranger needs a handle that is stable for the length of the session
// but says nothing about who they are. Derived from the session id, so both
// clients compute the same pair without a round trip and nothing is stored.

const ADJECTIVES = [
  "Quiet", "Amber", "Restless", "Golden", "Distant", "Velvet", "Northern",
  "Paper", "Copper", "Midnight", "Wandering", "Electric", "Hollow", "Certain",
  "Sunlit", "Patient", "Crooked", "Marble", "Winter", "Salted"
];
const NOUNS = [
  "Comet", "Kettle", "Harbour", "Lantern", "Sparrow", "Meridian", "Orchard",
  "Compass", "Anchor", "Thicket", "Pigeon", "Bellhop", "Cyclone", "Marigold",
  "Trumpet", "Cobble", "Whistle", "Almanac", "Ferry", "Domino"
];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Both participants get a different alias inside the same session.
export function aliasFor(sessionId: string, side: Side): string {
  const h = hash(sessionId + ":" + side);
  return `${ADJECTIVES[h % ADJECTIVES.length]} ${NOUNS[(h >>> 8) % NOUNS.length]}`;
}

// ── Names shown in an anonymous chat ──────────────────────────────────────
//
// What a stranger sees is the other member's self-chosen `displayName`, or
// a generated alias if they have not picked one. `User.name` — the real
// name — is read nowhere in this path and never reaches the client. It is
// disclosed only by the reveal flow, which moves the pair into a real
// Conversation where profiles are visible by design.
export async function chatNames(
  s: SessionRow,
  side: Side
): Promise<{ myName: string; partnerName: string }> {
  const myId = side === "A" ? s.userAId : s.userBId;
  const partnerId = side === "A" ? s.userBId : s.userAId;
  const otherSide: Side = side === "A" ? "B" : "A";

  const admin = supabaseAdmin();
  const chosen = new Map<string, string>();
  if (admin) {
    // Note the projection: displayName only. Never select name here.
    const { data } = await admin
      .from("User")
      .select("id,displayName")
      .in("id", [myId, partnerId]);
    for (const row of (data ?? []) as any[]) {
      const handle = (row.displayName ?? "").trim();
      if (handle) chosen.set(row.id, handle);
    }
  }

  return {
    myName: chosen.get(myId) ?? aliasFor(s.id, side),
    partnerName: chosen.get(partnerId) ?? aliasFor(s.id, otherSide)
  };
}

// ── Ending a session ──────────────────────────────────────────────────────

export type EndReason = "left" | "skipped" | "reported" | "expired";

// Idempotent: ending an already-ended session is a no-op that still returns
// cleanly, because both clients may fire this on unload at the same moment.
export async function endSession(
  sessionId: string,
  endedById: string | null,
  reason: EndReason
): Promise<void> {
  const admin = supabaseAdmin();
  if (!admin) return;
  await admin
    .from("RandomSession")
    .update({ endedAt: new Date().toISOString(), endedById, endReason: reason })
    .eq("id", sessionId)
    .is("endedAt", null);

  // Both participants drop out of the queue. Whoever wants another stranger
  // re-enters explicitly — we never silently re-queue someone.
  await admin.from("RandomQueue").delete().eq("sessionId", sessionId);
}

// The public shape of a session, from one participant's point of view.
// Note what is absent: the partner's user id and real name. Neither is ever
// sent to the client before a mutual reveal.
//
// Names are filled in by describeSession() — this stays pure so it can be
// used where a DB round trip is not wanted.
export function publicSession(s: SessionRow, side: Side) {
  const mine = side === "A";
  return {
    id: s.id,
    startedAt: s.startedAt,
    ended: s.endedAt !== null,
    endedByMe: s.endedById !== null && s.endedById === (mine ? s.userAId : s.userBId),
    endReason: s.endReason,
    myName: aliasFor(s.id, side),
    partnerName: aliasFor(s.id, mine ? "B" : "A"),
    keptByMe: mine ? s.keptByA : s.keptByB,
    revealAskedByMe: mine ? s.revealAskedByA : s.revealAskedByB,
    revealAskedByThem: mine ? s.revealAskedByB : s.revealAskedByA,
    revealed: s.revealAskedByA && s.revealAskedByB,
    conversationId: s.revealAskedByA && s.revealAskedByB ? s.conversationId : null,
    messageCount: s.messageCount
  };
}

// publicSession plus the chosen handles. This is what every random route
// returns to the client.
export async function describeSession(s: SessionRow, side: Side) {
  const names = await chatNames(s, side);
  return { ...publicSession(s, side), ...names };
}

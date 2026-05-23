import { db } from "./db";
import { getConfigInt } from "./config";

// ──────────────────────────────────────────────────────────────────────────
// Interaction-time chat cap
//
// The conversation has an `interactionSeconds` counter. Time advances ONLY
// when both users are actively engaged — i.e., both have sent or opened a
// message inside a rolling active window (default 120s, configurable).
//
// Implementation:
//   - Every heartbeat or message updates that user's `lastActiveA/B` timestamp.
//   - We compute the increment as:
//       delta = min(timeSinceLastBothActiveTick, activeWindowSeconds)
//     bounded to the time both users were *both* live since the last tick.
//   - If one user is idle past activeWindowSeconds, the timer pauses for the
//     idle portion of the gap — "she hasn't replied in 15 minutes" does NOT
//     burn the cap.
//   - When interactionSeconds >= capSeconds, lock the conversation.
// ──────────────────────────────────────────────────────────────────────────

const WALL_FOR = "lastInteractionAt"; // stored implicitly via updatedAt

export type Side = "A" | "B";

export async function recordActivityAndMaybeTick(args: {
  conversationId: string;
  side: Side;
  now?: Date;
}): Promise<{ interactionSeconds: number; locked: boolean; capSeconds: number }> {
  const now = args.now ?? new Date();
  const activeWindow = await getConfigInt("activeWindowSeconds");

  // Read current state.
  const conv = await db.conversation.findUnique({
    where: { id: args.conversationId }
  });
  if (!conv) throw new Error("conversation not found");

  // The "last tick anchor" is the more recent of (last activity of either
  // user) before this call — effectively the moment the previous tick was
  // computed. We use updatedAt as a safe lower bound (it advances on every
  // call to this function via the update below).
  const lastAnchor = conv.updatedAt;
  const wallDelta = Math.max(0, Math.floor((now.getTime() - lastAnchor.getTime()) / 1000));

  // To advance the timer, both users must have been "live" within the active
  // window of the moment we are evaluating. Practically: if the *other* user's
  // last activity is within `activeWindow` from now, we count the wallDelta
  // (capped by activeWindow so a long gap doesn't credit time retroactively).
  const otherLastActive = args.side === "A" ? conv.lastActiveB : conv.lastActiveA;
  let increment = 0;
  if (otherLastActive) {
    const otherAgeSec = Math.floor((now.getTime() - otherLastActive.getTime()) / 1000);
    if (otherAgeSec <= activeWindow) {
      increment = Math.min(wallDelta, activeWindow);
    }
  }

  const nextSeconds = conv.interactionSeconds + increment;
  const cap = conv.capSeconds;
  // Counter still ticks for analytics, but we never auto-lock the chat. The
  // UI no longer surfaces a timer; upgrades are a positive CTA, not a gate.
  const locked = false;

  const updateData: any = {
    interactionSeconds: nextSeconds,
    locked
  };
  if (args.side === "A") updateData.lastActiveA = now;
  else updateData.lastActiveB = now;

  await db.conversation.update({
    where: { id: args.conversationId },
    data: updateData
  });

  return { interactionSeconds: nextSeconds, locked, capSeconds: cap };
}

// Bumps the cap by the configured extension amount. Called after a successful
// payment for `chat_extension` (or as a free admin override).
export async function extendChatCap(conversationId: string, additionalSeconds?: number) {
  const seconds = additionalSeconds ?? (await getConfigInt("chatExtensionSeconds"));
  await db.conversation.update({
    where: { id: conversationId },
    data: {
      capSeconds: { increment: seconds },
      locked: false
    }
  });
}

// Resolve which side of the conversation the calling user is on.
export function sideOf(conv: { userAId: string; userBId: string }, userId: string): Side | null {
  if (conv.userAId === userId) return "A";
  if (conv.userBId === userId) return "B";
  return null;
}

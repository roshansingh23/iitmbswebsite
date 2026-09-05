import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { chatNames, sideOf, type SessionRow } from "@/lib/random";
import { sendPushToUser } from "@/lib/web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/random/queue
//
// Enter the queue, or poll it. Both are the same call: pair_random() upserts
// the caller's queue row and tries to claim a partner, returning the session
// id if it got one. That means the client can just hit this on a timer and
// the first response with a session is the match — no separate join/poll
// state machine to keep in sync.
//
// The pairing is atomic inside Postgres (SELECT … FOR UPDATE SKIP LOCKED),
// so two people connecting simultaneously can never claim the same partner.
export async function POST() {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!me.poolId) {
    return NextResponse.json(
      { error: "We couldn't place your email address. Contact support." },
      { status: 409 }
    );
  }
  if (me.paused) {
    return NextResponse.json({ error: "Your profile is paused." }, { status: 409 });
  }

  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const rl = await checkRateLimit("random_pair", me.id);
  if (!rl.ok) return NextResponse.json({ error: rl.reason }, { status: 429 });

  const { data: sessionId, error } = await admin.rpc("pair_random", {
    p_user_id: me.id,
    p_pool_id: me.poolId
  });

  if (error) {
    console.error("pair_random failed:", error.message);
    return NextResponse.json({ error: "Couldn't reach the queue. Try again." }, { status: 500 });
  }

  if (!sessionId) {
    // Nobody to pair with yet. Anyone who asked to be told when the pool
    // wakes up gets their push now — I am the person who woke it. Rows are
    // consumed so the same arrival cannot notify them twice.
    //
    // Fire-and-forget: a failed push must never hold up the queue response.
    notifyWaiters(admin, me.poolId, me.id).catch(() => {});

    // Presence, not queue depth. Counting the queue would read zero every
    // time: pair_random() takes any waiting person, so if we are still
    // waiting there is nobody pairable left to count. See the migration.
    // Independent of each other, so they go together. Serialising them
    // added a whole round trip to an endpoint the client polls every 2s.
    const [{ data: counts }, { data: ping }] = await Promise.all([
      admin.rpc("online_counts", { p_user_id: me.id, p_pool_id: me.poolId }),
      admin.from("RandomPing").select("userId").eq("userId", me.id).maybeSingle()
    ]);
    const row = Array.isArray(counts) ? counts[0] : counts;

    return NextResponse.json({
      status: "waiting",
      onlineCount: Number(row?.online ?? 0),
      sharedCount: Number(row?.shared ?? 0),
      notifyRegistered: !!ping
    });
  }

  const { data: session } = await admin
    .from("RandomSession")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "Match vanished. Try again." }, { status: 500 });
  }

  const side = sideOf(session as SessionRow, me.id);
  if (!side) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const names = await chatNames(session as SessionRow, side);
  return NextResponse.json({ status: "paired", sessionId: session.id, ...names });
}

// Push everyone in this pool who asked to be told when it woke up, then
// consume their rows. Excludes the person who just arrived.
async function notifyWaiters(admin: any, poolId: string, arrivalId: string) {
  const { data: pings } = await admin
    .from("RandomPing")
    .select("userId")
    .eq("poolId", poolId)
    .neq("userId", arrivalId)
    .limit(200);

  const ids = ((pings ?? []) as any[]).map((p) => p.userId);
  if (ids.length === 0) return;

  // Delete first. If the push fails we would rather drop a notification
  // than send the same one every time somebody opens the queue.
  await admin.from("RandomPing").delete().in("userId", ids);

  await Promise.all(
    ids.map((id) =>
      sendPushToUser(id, {
        title: "Someone's around",
        body: "There's someone waiting to talk on Random.",
        url: "/random",
        tag: "random-pool-awake"
      }).catch(() => {})
    )
  );
}

// DELETE /api/random/queue — stop waiting. Fired when the user backs out of
// the waiting screen, and on page unload via sendBeacon.
export async function DELETE() {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  // Only tear down a row that is still waiting — if the matchmaker paired us
  // in the gap between the user tapping cancel and this landing, the session
  // is real and the client will be shown it.
  await admin.from("RandomQueue").delete().eq("userId", me.id).eq("state", "waiting");
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/random/notify — "tell me when someone is around".
//
// For the thin-pool case: you opened Random, nobody was there, and you are
// not going to sit on a spinner. We keep a row; the next person who enters
// the queue in your pool triggers a push and the row is consumed.
//
// One row per member, so asking twice is not two notifications.
export async function POST() {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!me.poolId) {
    return NextResponse.json({ error: "We couldn't place your email address." }, { status: 409 });
  }

  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const { error } = await admin
    .from("RandomPing")
    .upsert(
      { userId: me.id, poolId: me.poolId, createdAt: new Date().toISOString() },
      { onConflict: "userId" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Leaving the queue is the point — they are not waiting any more.
  await admin.from("RandomQueue").delete().eq("userId", me.id).eq("state", "waiting");

  return NextResponse.json({ ok: true });
}

// DELETE — never mind.
export async function DELETE() {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  await admin.from("RandomPing").delete().eq("userId", me.id);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { supabaseAdmin, supabaseBroadcast } from "@/lib/supabase-server";
import { describeSession, loadSessionFor, newId, type SessionRow } from "@/lib/random";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/random/[id]/reveal — ask to drop the masks.
//
// This is the bridge between the two halves of the app. One side asking
// shows the other a prompt; when BOTH have asked, we mint a real Match +
// Conversation and the pair moves into the normal chat, with profiles
// visible. Nothing about either identity is disclosed until that point.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const found = await loadSessionFor(params.id, me.id);
  if (!found) return NextResponse.json({ error: "not found" }, { status: 404 });

  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const column = found.side === "A" ? "revealAskedByA" : "revealAskedByB";
  const { data: updated } = await admin
    .from("RandomSession")
    .update({ [column]: true })
    .eq("id", params.id)
    .select("*")
    .single();

  let session = updated as SessionRow;

  // Both sides in? Create the durable pairing, once.
  if (session.revealAskedByA && session.revealAskedByB && !session.conversationId) {
    const now = new Date().toISOString();
    const matchId = newId("mt");
    const conversationId = newId("cv");

    await admin.from("Match").insert({
      id: matchId,
      userAId: session.userAId,
      userBId: session.userBId,
      createdAt: now
    });

    const { error: convError } = await admin.from("Conversation").insert({
      id: conversationId,
      matchId,
      userAId: session.userAId,
      userBId: session.userBId,
      capSeconds: 900,
      createdAt: now,
      updatedAt: now
    });

    if (!convError) {
      const { data: linked } = await admin
        .from("RandomSession")
        .update({ conversationId })
        .eq("id", params.id)
        .select("*")
        .single();
      if (linked) session = linked as SessionRow;
    }
  }

  await supabaseBroadcast("random:" + params.id, "reveal", {
    by: found.side,
    both: session.revealAskedByA && session.revealAskedByB
  }).catch(() => {});

  return NextResponse.json({ session: await describeSession(session, found.side) });
}

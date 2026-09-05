import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { supabaseAdmin, supabaseBroadcast } from "@/lib/supabase-server";
import { endSession, loadSessionFor, newId, partnerIdOf } from "@/lib/random";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/random/[id]/block — block the stranger and end the chat.
//
// The block is stored against their real user id even though the caller
// never sees it, so the matchmaker will refuse to pair these two again
// (pair_random checks Block in both directions) and they stay invisible to
// each other in discover. An optional `reason` also files a report.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const found = await loadSessionFor(params.id, me.id);
  if (!found) return NextResponse.json({ error: "not found" }, { status: 404 });

  const partnerId = partnerIdOf(found.session, me.id);
  if (!partnerId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 1000) : "";

  // A duplicate block is not an error worth surfacing — the unique index
  // rejects it and we carry on to ending the session.
  const { error: blockError } = await admin
    .from("Block")
    .insert({ id: newId("bk"), fromUserId: me.id, toUserId: partnerId, createdAt: new Date().toISOString() });
  if (blockError && !/duplicate|unique/i.test(blockError.message)) {
    console.error("random block insert failed:", blockError.message);
  }

  if (reason) {
    await admin.from("Report").insert({
      id: newId("rp"),
      reporterId: me.id,
      targetType: "user",
      targetUserId: partnerId,
      reason: "[random chat " + params.id + "] " + reason,
      status: "open",
      createdAt: new Date().toISOString()
    });
  }

  if (!found.session.endedAt) {
    await endSession(params.id, me.id, reason ? "reported" : "left");
    await supabaseBroadcast("random:" + params.id, "ended", { by: found.side, reason: "left" }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

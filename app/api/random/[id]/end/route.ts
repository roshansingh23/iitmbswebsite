import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { supabaseBroadcast } from "@/lib/supabase-server";
import { endSession, loadSessionFor, type EndReason } from "@/lib/random";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REASONS: EndReason[] = ["left", "skipped", "reported"];

// POST /api/random/[id]/end — hang up. "skipped" is the Next-stranger button,
// "left" is closing the room. Idempotent, because both clients can fire this
// on unload at the same moment.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const found = await loadSessionFor(params.id, me.id);
  if (!found) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const reason: EndReason = REASONS.includes(body?.reason) ? body.reason : "left";

  if (!found.session.endedAt) {
    await endSession(params.id, me.id, reason);
    await supabaseBroadcast("random:" + params.id, "ended", { by: found.side, reason }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

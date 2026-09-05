import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { describeSession, loadSessionFor } from "@/lib/random";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/random/[id] — the caller's view of one session. Polled by the
// room so a partner leaving, keeping, or asking to reveal shows up even
// when the realtime channel is unavailable.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const found = await loadSessionFor(params.id, me.id);
  if (!found) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ session: await describeSession(found.session, found.side) });
}

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { describeSession, loadSessionFor } from "@/lib/random";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/random/[id]/keep — save this chat to my history.
//
// Per-side and one-way: keeping is my decision about my own copy, the
// stranger is not told and cannot veto it. A session either side kept is
// exempt from the retention sweep, which is what makes "history stays if
// they want" true without keeping everything forever.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const found = await loadSessionFor(params.id, me.id);
  if (!found) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const keep = body?.keep === false ? false : true;

  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const column = found.side === "A" ? "keptByA" : "keptByB";
  const { data } = await admin
    .from("RandomSession")
    .update({ [column]: keep })
    .eq("id", params.id)
    .select("*")
    .single();

  return NextResponse.json({ session: await describeSession(data as any, found.side) });
}

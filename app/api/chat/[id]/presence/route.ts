import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Active" = the other person used the app (any screen) in the last 15
// minutes. Read-only, so it's cheap to poll for a live green dot.
const ACTIVE_WINDOW_MS = 15 * 60 * 1000;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const { data: conv } = await admin
    .from("Conversation")
    .select("userAId,userBId")
    .eq("id", params.id)
    .maybeSingle();
  if (!conv) return NextResponse.json({ error: "not found" }, { status: 404 });
  if ((conv as any).userAId !== me.id && (conv as any).userBId !== me.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const otherId = (conv as any).userAId === me.id ? (conv as any).userBId : (conv as any).userAId;

  const { data: other } = await admin
    .from("User")
    .select("lastSeenAt")
    .eq("id", otherId)
    .maybeSingle();
  const last = (other as any)?.lastSeenAt;
  const active = last ? Date.now() - new Date(last).getTime() < ACTIVE_WINDOW_MS : false;
  return NextResponse.json({ active });
}

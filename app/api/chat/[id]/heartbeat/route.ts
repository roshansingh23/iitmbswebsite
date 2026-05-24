import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const { data: conv } = await admin
    .from("Conversation")
    .select("id,userAId,userBId")
    .eq("id", params.id)
    .maybeSingle();
  if (!conv) return NextResponse.json({ error: "not found" }, { status: 404 });

  const side = (conv as any).userAId === me.id ? "A" : (conv as any).userBId === me.id ? "B" : null;
  if (!side) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const now = new Date().toISOString();
  const updates: any = { updatedAt: now };
  if (side === "A") updates.lastActiveA = now;
  else updates.lastActiveB = now;
  await admin.from("Conversation").update(updates).eq("id", params.id);

  await admin.from("User").update({ lastSeenAt: now }).eq("id", me.id);

  return NextResponse.json({ ok: true });
}

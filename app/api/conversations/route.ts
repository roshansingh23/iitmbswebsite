import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight conversation list for the desktop chat panel. Returns
// other-user id/name/first photo and the conversation's updatedAt.
export async function GET() {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const { data: convs } = await admin
    .from("Conversation")
    .select(
      "id,userAId,userBId,updatedAt," +
      "userA:User!Conversation_userAId_fkey(id,name)," +
      "userB:User!Conversation_userBId_fkey(id,name)"
    )
    .or(`userAId.eq.${me.id},userBId.eq.${me.id}`)
    .order("updatedAt", { ascending: false })
    .limit(50);

  const items = await Promise.all((convs ?? []).map(async (c: any) => {
    const other = c.userAId === me.id ? c.userB : c.userA;
    let photo: string | null = null;
    if (other?.id) {
      const { data: ph } = await admin
        .from("Photo")
        .select("url")
        .eq("userId", other.id)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (ph) photo = (ph as any).url;
    }
    return {
      id: c.id,
      otherId: other?.id ?? null,
      otherName: other?.name ?? "—",
      otherPhoto: photo,
      updatedAt: c.updatedAt
    };
  }));

  return NextResponse.json({ conversations: items });
}

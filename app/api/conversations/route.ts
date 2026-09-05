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

  // Only mutual matches: matchId is non-null exactly when both parties
  // have hooked. Without this filter, conversations created on a one-
  // sided hook would surface as "Chats" before the other side replied.
  // Photos are embedded rather than fetched per conversation. The previous
  // version issued one Photo query per row inside a Promise.all — with the
  // 50-row limit that was up to 51 round trips for a panel that renders on
  // every page, and it dominated the response time.
  const { data: convs } = await admin
    .from("Conversation")
    .select(
      "id,userAId,userBId,updatedAt,matchId," +
      "userA:User!Conversation_userAId_fkey(id,name,photos:Photo(url,position))," +
      "userB:User!Conversation_userBId_fkey(id,name,photos:Photo(url,position))"
    )
    .or(`userAId.eq.${me.id},userBId.eq.${me.id}`)
    .not("matchId", "is", null)
    .order("updatedAt", { ascending: false })
    .limit(50);

  const items = (convs ?? []).map((c: any) => {
    const other = c.userAId === me.id ? c.userB : c.userA;
    // Lowest position wins — the same "first photo" the old query picked
    // with .order(position).limit(1), just chosen in memory.
    const photo =
      [...(other?.photos ?? [])]
        .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))[0]?.url ?? null;
    return {
      id: c.id,
      otherId: other?.id ?? null,
      otherName: other?.name ?? "—",
      otherPhoto: photo,
      updatedAt: c.updatedAt
    };
  });

  return NextResponse.json({ conversations: items });
}

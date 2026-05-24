import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { supabaseAdmin, supabaseBroadcast } from "@/lib/supabase-server";

export const runtime = "nodejs";

// Recipient calls this each time they open a photo message. Decrements
// viewsRemaining. When it hits zero, the photoUrl + photoPublicId are
// cleared on the server so the asset is no longer accessible from the app.
//
// Sender opening their own message doesn't consume a view — they always
// see the photo until it expires.
export async function POST(
  _req: Request,
  { params }: { params: { id: string; msgId: string } }
) {
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

  const { data: msg } = await admin
    .from("Message")
    .select("id,conversationId,fromUserId,messageType,photoUrl,viewsRemaining")
    .eq("id", params.msgId)
    .eq("conversationId", params.id)
    .maybeSingle();
  if (!msg) return NextResponse.json({ error: "not found" }, { status: 404 });
  if ((msg as any).messageType !== "photo") {
    return NextResponse.json({ error: "not a photo" }, { status: 400 });
  }
  if (!(msg as any).photoUrl) {
    return NextResponse.json({ expired: true }, { status: 410 });
  }

  // Sender peeking at their own message — return URL but don't decrement.
  if ((msg as any).fromUserId === me.id) {
    return NextResponse.json({
      url: (msg as any).photoUrl,
      viewsRemaining: (msg as any).viewsRemaining ?? 0
    });
  }

  const before = (msg as any).viewsRemaining ?? 0;
  if (before <= 0) {
    // Defensive: shouldn't hit since photoUrl null'd at zero, but cover it.
    await admin.from("Message").update({ photoUrl: null, photoPublicId: null })
      .eq("id", params.msgId);
    return NextResponse.json({ expired: true }, { status: 410 });
  }

  const after = before - 1;
  const updates: any = { viewsRemaining: after };
  if (after === 0) {
    updates.photoUrl = null;
    updates.photoPublicId = null;
  }
  await admin.from("Message").update(updates).eq("id", params.msgId);

  // Tell both sides the counter changed so the bubble updates live.
  await supabaseBroadcast(`conv:${params.id}`, "photoView", {
    messageId: params.msgId,
    viewsRemaining: after,
    expired: after === 0
  }).catch(() => {});

  return NextResponse.json({
    url: (msg as any).photoUrl,
    viewsRemaining: after
  });
}

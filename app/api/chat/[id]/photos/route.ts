import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { supabaseAdmin, supabaseBroadcast } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendPushToUser } from "@/lib/web-push";

export const runtime = "nodejs";

// Sender posts an already-uploaded Cloudinary asset. We mint a Message row
// with messageType='photo' and a 3-view counter. The recipient consumes
// views through /api/chat/[id]/messages/[msgId]/view; once viewsRemaining
// hits zero the URL is nulled out on the server.
const schema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1)
});

function cuid() {
  return "c" + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
}

async function ownerSide(conversationId: string, userId: string) {
  const admin = supabaseAdmin();
  if (!admin) return null;
  const { data: conv } = await admin
    .from("Conversation")
    .select("id,userAId,userBId")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv) return null;
  if ((conv as any).userAId === userId) return "A" as const;
  if ((conv as any).userBId === userId) return "B" as const;
  return null;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const side = await ownerSide(params.id, me.id);
  if (!side) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Photo messages count against the same per-user message budget.
  const rl = await checkRateLimit("message", me.id);
  if (!rl.ok) return NextResponse.json({ error: rl.reason }, { status: 429 });

  const now = new Date().toISOString();
  const msg = {
    id: cuid(),
    conversationId: params.id,
    fromUserId: me.id,
    body: null,
    messageType: "photo",
    photoUrl: parsed.data.url,
    photoPublicId: parsed.data.publicId,
    viewsRemaining: 3,
    createdAt: now
  };
  const { error } = await admin.from("Message").insert(msg);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const updates: any = { updatedAt: now };
  if (side === "A") updates.lastActiveA = now;
  else updates.lastActiveB = now;
  await admin.from("Conversation").update(updates).eq("id", params.id);

  // Broadcast without the photo URL — recipients only get the URL by
  // consuming a view through /view (which decrements the counter).
  await supabaseBroadcast(`conv:${params.id}`, "message", {
    id: msg.id,
    body: null,
    messageType: "photo",
    photoUrl: null,
    viewsRemaining: 3,
    fromUserId: msg.fromUserId,
    createdAt: msg.createdAt
  }).catch(() => {});

  // Push the other party.
  const otherId = (await admin
    .from("Conversation")
    .select("userAId,userBId")
    .eq("id", params.id)
    .maybeSingle()).data;
  const recipient = otherId
    ? ((otherId as any).userAId === me.id ? (otherId as any).userBId : (otherId as any).userAId)
    : null;
  if (recipient) {
    sendPushToUser(recipient, {
      title: me.name ?? "New photo",
      body: "sent you a photo",
      url: `/chat/${params.id}`,
      tag: `chat:${params.id}`
    }).catch(() => {});
  }

  return NextResponse.json({
    message: {
      id: msg.id,
      body: null,
      messageType: "photo",
      photoUrl: msg.photoUrl,
      viewsRemaining: 3,
      fromUserId: msg.fromUserId,
      createdAt: msg.createdAt
    }
  });
}

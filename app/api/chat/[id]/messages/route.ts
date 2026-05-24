import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { supabaseAdmin, supabaseBroadcast } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendPushToUser } from "@/lib/web-push";

export const runtime = "nodejs";

const schema = z.object({ body: z.string().min(1).max(1000) });

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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  if (!(await ownerSide(params.id, me.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const after = new URL(req.url).searchParams.get("after") ?? undefined;
  let q = admin.from("Message")
    .select("id,body,fromUserId,createdAt,messageType,photoUrl,viewsRemaining")
    .eq("conversationId", params.id)
    .order("createdAt", { ascending: true })
    .limit(100);

  if (after) {
    const { data: anchor } = await admin.from("Message").select("createdAt").eq("id", after).maybeSingle();
    if (anchor) q = q.gt("createdAt", (anchor as any).createdAt);
  }
  const { data: messages } = await q;
  return NextResponse.json({
    messages: (messages ?? []).map((m: any) => ({
      id: m.id,
      body: m.body,
      fromUserId: m.fromUserId,
      messageType: m.messageType ?? "text",
      // Don't leak the photo URL to recipients here — they must consume a
      // view via /view to get the URL. Senders see their own URLs.
      photoUrl: m.fromUserId === me.id ? (m.photoUrl ?? null) : null,
      viewsRemaining: m.viewsRemaining ?? null,
      createdAt: typeof m.createdAt === "string" ? m.createdAt : new Date(m.createdAt).toISOString()
    }))
  });
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

  const rl = await checkRateLimit("message", me.id);
  if (!rl.ok) return NextResponse.json({ error: rl.reason }, { status: 429 });

  const now = new Date().toISOString();
  const msg = {
    id: cuid(),
    conversationId: params.id,
    fromUserId: me.id,
    body: parsed.data.body,
    createdAt: now
  };
  const { error } = await admin.from("Message").insert(msg);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Touch conversation updatedAt + lastActive side
  const updates: any = { updatedAt: now };
  if (side === "A") updates.lastActiveA = now;
  else updates.lastActiveB = now;
  await admin.from("Conversation").update(updates).eq("id", params.id);

  await supabaseBroadcast(`conv:${params.id}`, "message", {
    id: msg.id, body: msg.body, fromUserId: msg.fromUserId, createdAt: msg.createdAt
  }).catch(() => {});

  // Push the other party. Fire-and-forget — never block the response.
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
      title: me.name ?? "New message",
      body: parsed.data.body.slice(0, 140),
      url: `/chat/${params.id}`,
      tag: `chat:${params.id}`
    }).catch(() => {});
  }

  return NextResponse.json({
    message: { id: msg.id, body: msg.body, fromUserId: msg.fromUserId, createdAt: msg.createdAt }
  });
}

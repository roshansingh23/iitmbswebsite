import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { recordActivityAndMaybeTick, sideOf } from "@/lib/chat-timekeeper";
import { supabaseBroadcast } from "@/lib/supabase-server";

export const runtime = "nodejs";

const schema = z.object({ body: z.string().min(1).max(1000) });

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const conv = await db.conversation.findUnique({
    where: { id: params.id },
    select: { id: true, userAId: true, userBId: true }
  });
  if (!conv) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!sideOf(conv, me.id)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const after = new URL(req.url).searchParams.get("after") ?? undefined;
  const where: any = { conversationId: conv.id };
  if (after) {
    const anchor = await db.message.findUnique({ where: { id: after }, select: { createdAt: true } });
    if (anchor) where.createdAt = { gt: anchor.createdAt };
  }
  const messages = await db.message.findMany({
    where, orderBy: { createdAt: "asc" }, take: 100
  });
  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id, body: m.body, fromUserId: m.fromUserId, createdAt: m.createdAt.toISOString()
    }))
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const conv = await db.conversation.findUnique({
    where: { id: params.id },
    select: { id: true, userAId: true, userBId: true, locked: true }
  });
  if (!conv) return NextResponse.json({ error: "not found" }, { status: 404 });
  const side = sideOf(conv, me.id);
  if (!side) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const msg = await db.message.create({
    data: { conversationId: conv.id, fromUserId: me.id, body: parsed.data.body }
  });

  const tick = await recordActivityAndMaybeTick({ conversationId: conv.id, side });

  // Broadcast to the other side via Supabase Realtime (no-op if no key).
  await supabaseBroadcast(`conv:${conv.id}`, "message", {
    id: msg.id, body: msg.body, fromUserId: msg.fromUserId, createdAt: msg.createdAt.toISOString()
  }).catch(() => {});

  return NextResponse.json({
    message: { id: msg.id, body: msg.body, fromUserId: msg.fromUserId, createdAt: msg.createdAt.toISOString() },
    interactionSeconds: tick.interactionSeconds,
    locked: tick.locked
  });
}

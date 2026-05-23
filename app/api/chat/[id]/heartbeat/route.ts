import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { recordActivityAndMaybeTick, sideOf } from "@/lib/chat-timekeeper";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const conv = await db.conversation.findUnique({
    where: { id: params.id },
    select: { id: true, userAId: true, userBId: true, locked: true }
  });
  if (!conv) return NextResponse.json({ error: "not found" }, { status: 404 });

  const side = sideOf(conv, me.id);
  if (!side) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Touch user.lastSeenAt opportunistically.
  await db.user.update({ where: { id: me.id }, data: { lastSeenAt: new Date() } });

  const result = await recordActivityAndMaybeTick({ conversationId: conv.id, side });
  return NextResponse.json(result);
}

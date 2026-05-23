import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

const schema = z.object({
  targetType: z.enum(["user", "message", "confession", "confession_reply", "photo"]),
  targetId: z.string().min(1),
  reason: z.string().min(2).max(500)
});

export async function POST(req: Request) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { targetType, targetId, reason } = parsed.data;

  await db.report.create({
    data: {
      reporterId: me.id,
      reason,
      targetType,
      targetUserId: targetType === "user" ? targetId : undefined,
      targetMessageId: targetType === "message" ? targetId : undefined,
      targetConfessionId: targetType === "confession" ? targetId : undefined,
      targetReplyId: targetType === "confession_reply" ? targetId : undefined
    }
  });
  return NextResponse.json({ ok: true });
}

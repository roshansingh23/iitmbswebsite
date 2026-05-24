import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

const schema = z.object({
  targetType: z.enum(["user", "message", "confession", "confession_reply", "photo"]),
  targetId: z.string().min(1),
  reason: z.string().min(2).max(500)
});

function cuid() {
  return "c" + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
}

export async function POST(req: Request) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { targetType, targetId, reason } = parsed.data;

  const row: any = {
    id: cuid(),
    reporterId: me.id,
    targetType,
    reason,
    status: "open",
    createdAt: new Date().toISOString()
  };
  if (targetType === "user") row.targetUserId = targetId;
  if (targetType === "message") row.targetMessageId = targetId;
  if (targetType === "confession") row.targetConfessionId = targetId;
  if (targetType === "confession_reply") row.targetReplyId = targetId;

  const { error } = await admin.from("Report").insert(row);
  if (error) {
    console.error("report insert failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
